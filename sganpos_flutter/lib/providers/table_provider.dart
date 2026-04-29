import 'package:flutter/foundation.dart';
import '../models/table.dart';
import '../services/api_client.dart';

class TableProvider extends ChangeNotifier {
  List<TableModel> _tables = [];
  bool _isLoading = false;
  String? _error;

  // Getters
  List<TableModel> get tables => _tables;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Fetch all tables from API
  Future<bool> fetchTables(ApiClient apiClient) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      _tables = await apiClient.getTables();
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Get a single table by ID
  TableModel? getTable(String tableId) {
    try {
      return _tables.firstWhere((table) => table.id == tableId);
    } catch (e) {
      return null;
    }
  }

  /// Update table status locally and on server
  Future<bool> updateTableStatus(
    ApiClient apiClient,
    String tableId,
    String status, {
    String? currentOrderId,
  }) async {
    try {
      _error = null;

      // Update on server
      final updatedTable = await apiClient.updateTable(
        tableId,
        status: status,
        currentOrderId: currentOrderId,
      );

      // Update local state
      final index = _tables.indexWhere((t) => t.id == tableId);
      if (index != -1) {
        _tables[index] = updatedTable;
        notifyListeners();
      }

      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  /// Handle real-time table update from Socket.io
  void updateTableFromSocket(Map<String, dynamic> data) {
    try {
      final updatedTable = TableModel.fromJson(data);
      final index = _tables.indexWhere((t) => t.id == updatedTable.id);

      if (index != -1) {
        _tables[index] = updatedTable;
      } else {
        _tables.add(updatedTable);
      }
      notifyListeners();
    } catch (e) {
      _error = 'Failed to update table: $e';
      notifyListeners();
    }
  }

  /// Get tables grouped by section
  Map<String, List<TableModel>> getTablesBySection() {
    final grouped = <String, List<TableModel>>{};

    for (final table in _tables) {
      final section = table.section ?? 'Chưa phân loại';
      if (!grouped.containsKey(section)) {
        grouped[section] = [];
      }
      grouped[section]!.add(table);
    }

    return grouped;
  }

  /// Get count of occupied tables
  int get occupiedTableCount {
    return _tables.where((t) => t.isOccupied).length;
  }

  /// Get count of empty tables
  int get emptyTableCount {
    return _tables.where((t) => t.isEmpty).length;
  }

  /// Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
