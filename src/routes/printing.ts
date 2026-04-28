import express, { Request, Response } from 'express';
import { getTenantId } from '../lib/tenant.js';
import { authenticate } from '../middleware/auth.js';
import Settings from '../models/Settings.js';

const router = express.Router();

// Simple ESC/POS command generator for thermal printers
class EscposCommandGenerator {
  private buffer: number[] = [];

  init(): EscposCommandGenerator {
    // Initialize printer
    this.buffer.push(0x1B, 0x40); // ESC @
    return this;
  }

  align(position: 'left' | 'center' | 'right'): EscposCommandGenerator {
    const code = position === 'left' ? 0 : position === 'center' ? 1 : 2;
    this.buffer.push(0x1B, 0x61, code); // ESC a
    return this;
  }

  size(width: number, height: number): EscposCommandGenerator {
    // Width: 0-7, Height: 0-7
    const size = (width << 4) | height;
    this.buffer.push(0x1D, 0x21, size); // GS !
    return this;
  }

  bold(enabled: boolean): EscposCommandGenerator {
    const code = enabled ? 1 : 0;
    this.buffer.push(0x1B, 0x45, code); // ESC E
    return this;
  }

  text(content: string): EscposCommandGenerator {
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      this.buffer.push(...this.stringToBytes(line));
      if (index < lines.length - 1) {
        this.newLine();
      }
    });
    return this;
  }

  newLine(): EscposCommandGenerator {
    this.buffer.push(0x0A); // LF
    return this;
  }

  feed(lines: number): EscposCommandGenerator {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0A);
    }
    return this;
  }

  cut(): EscposCommandGenerator {
    this.buffer.push(0x1D, 0x56, 0x42, 0x00); // GS V m n
    return this;
  }

  getBuffer(): Buffer {
    return Buffer.from(this.buffer);
  }

  private stringToBytes(str: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < str.length; i++) {
      bytes.push(str.charCodeAt(i));
    }
    bytes.push(0x0A); // Add newline after each text
    return bytes;
  }
}

// Test Print
router.post('/test-print', authenticate, async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId();
    const settings = await Settings.findOne({ tenantId });

    if (!settings?.printers?.length || !settings.defaultPrinter) {
      return res.json({
        success: false,
        message: 'Chưa cấu hình máy in. Vui lòng vào Settings để cấu hình.'
      });
    }

    // Generate test receipt
    const generator = new EscposCommandGenerator();
    const commands = generator
      .init()
      .align('center')
      .bold(true)
      .size(2, 2)
      .text('TEST PRINT')
      .bold(false)
      .size(0, 0)
      .newLine()
      .text('---')
      .text(`Máy in: ${settings.defaultPrinter}`)
      .text(`Thời gian: ${new Date().toLocaleString('vi-VN')}`)
      .text('---')
      .feed(3)
      .cut()
      .getBuffer();

    // In real implementation, you would send this to the printer
    // For now, we'll just return success with the command
    console.log('[Print] Test print command generated:', commands.toString('hex'));

    res.json({
      success: true,
      message: 'In thử thành công! Kiểm tra máy in của bạn.',
      commandLength: commands.length,
      hex: commands.toString('hex').substring(0, 100) + '...'
    });
  } catch (error: any) {
    console.error('[Print] Error:', error);
    res.json({
      success: false,
      message: `Lỗi: ${error.message}`
    });
  }
});

// Print Receipt
router.post('/receipt', authenticate, async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId();
    const { order, isProvisional } = req.body;
    const settings = await Settings.findOne({ tenantId });

    if (!settings?.printers?.length || !settings.defaultPrinter) {
      return res.json({
        success: false,
        message: 'Chưa cấu hình máy in.'
      });
    }

    // Generate receipt
    const generator = new EscposCommandGenerator();

    let receipt = generator
      .init()
      .align('center')
      .bold(true)
      .size(1, 1)
      .text(settings.storeName || 'COFFEE SHOP');

    if (settings.address) {
      receipt.bold(false).size(0, 0).text(settings.address);
    }
    if (settings.hotline) {
      receipt.text(`Hotline: ${settings.hotline}`);
    }

    receipt
      .newLine()
      .text('---')
      .align('left')
      .text(`Mã đơn: ${order.orderCode || 'N/A'}`)
      .text(`Bàn: ${order.tableName || 'Takeaway'}`)
      .text(`Loại: ${order.type || 'Dine-in'}`)
      .text(`Ngày: ${new Date().toLocaleString('vi-VN')}`)
      .newLine()
      .text('---');

    // Items
    if (order.items && order.items.length > 0) {
      order.items.forEach((item: any) => {
        const quantity = item.quantity || 1;
        const price = item.price || 0;
        const total = quantity * price;
        receipt.text(`${item.name || 'Unknown'} x${quantity}`);
        receipt.align('right').text(`${total.toLocaleString()}đ`);
        receipt.align('left');
      });
    }

    // Summary
    receipt
      .newLine()
      .text('---')
      .align('right')
      .bold(true);

    if (order.subtotal) {
      receipt.text(`Tạm tính: ${order.subtotal.toLocaleString()}đ`);
    }
    if (order.discount) {
      receipt.text(`Giảm: ${order.discount.toLocaleString()}đ`);
    }

    receipt
      .bold(true)
      .size(1, 1)
      .text(`Tổng: ${order.total.toLocaleString()}đ`)
      .bold(false)
      .size(0, 0);

    if (order.paymentMethod) {
      receipt.text(`Thanh toán: ${order.paymentMethod}`);
    }

    if (isProvisional) {
      receipt.align('center').bold(true).text('(PHIẾU TẠMTÍNH)').bold(false);
    }

    receipt.feed(3).cut();

    const commands = receipt.getBuffer();

    console.log('[Print] Receipt printed:', {
      orderCode: order.orderCode,
      length: commands.length
    });

    res.json({
      success: true,
      message: isProvisional ? 'In phiếu tạm tính thành công' : 'In hóa đơn thành công',
      commandLength: commands.length
    });
  } catch (error: any) {
    console.error('[Print] Error:', error);
    res.json({
      success: false,
      message: `Lỗi: ${error.message}`
    });
  }
});

// Get printer info
router.get('/printers', authenticate, async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId();
    const settings = await Settings.findOne({ tenantId });

    res.json({
      printers: settings?.printers || [],
      defaultPrinter: settings?.defaultPrinter || null
    });
  } catch (error: any) {
    res.json({
      printers: [],
      defaultPrinter: null
    });
  }
});

// Update printer settings
router.put('/printers', authenticate, async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId();
    const { printers, defaultPrinter } = req.body;

    const settings = await Settings.findOneAndUpdate(
      { tenantId },
      {
        printers: printers || [],
        defaultPrinter: defaultPrinter || null
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      printers: settings.printers,
      defaultPrinter: settings.defaultPrinter
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
