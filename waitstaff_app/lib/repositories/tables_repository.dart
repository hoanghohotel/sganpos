import 'package:logger/logger.dart';
import '../config/app_config.dart';
import '../models/table_model.dart';
import '../services/api_client.dart';

class TablesRepository {
  final ApiClient _apiClient;
  final Logger _logger = Logger();

  TablesRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  Future<List<TableData>> getAllTables() async {
    try {
      final response = await _apiClient.get(AppConfig.tablesEndpoint);

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        final tables = (data['tables'] as List<dynamic>?)
            ?.map((table) => TableData.fromJson(table as Map<String, dynamic>))
            .toList() ?? [];
        _logger.i('Fetched ${tables.length} tables');
        return tables;
      }
      return [];
    } catch (e) {
      _logger.e('Failed to fetch tables: $e');
      rethrow;
    }
  }

  Future<TableData> getTable(String tableId) async {
    try {
      final response = await _apiClient.get(
        '${AppConfig.tablesEndpoint}/$tableId',
      );

      if (response.statusCode == 200) {
        final table = TableData.fromJson(response.data as Map<String, dynamic>);
        _logger.i('Fetched table: $tableId');
        return table;
      }
      throw Exception('Failed to fetch table');
    } catch (e) {
      _logger.e('Failed to fetch table: $e');
      rethrow;
    }
  }

  Future<List<TableData>> getTablesByStatus(TableStatus status) async {
    try {
      final response = await _apiClient.get(
        AppConfig.tablesEndpoint,
        queryParameters: {'status': status.toString().split('.').last},
      );

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        final tables = (data['tables'] as List<dynamic>?)
            ?.map((table) => TableData.fromJson(table as Map<String, dynamic>))
            .toList() ?? [];
        _logger.i('Fetched ${tables.length} ${status.toString().split('.').last} tables');
        return tables;
      }
      return [];
    } catch (e) {
      _logger.e('Failed to fetch tables by status: $e');
      rethrow;
    }
  }

  Future<TableData> updateTableStatus({
    required String tableId,
    required TableStatus status,
  }) async {
    try {
      final response = await _apiClient.put(
        '${AppConfig.tablesEndpoint}/$tableId',
        data: {
          'status': status.toString().split('.').last,
        },
      );

      if (response.statusCode == 200) {
        final table = TableData.fromJson(response.data as Map<String, dynamic>);
        _logger.i('Table status updated: $tableId -> ${status.toString().split('.').last}');
        return table;
      }
      throw Exception('Failed to update table status');
    } catch (e) {
      _logger.e('Failed to update table status: $e');
      rethrow;
    }
  }
}
