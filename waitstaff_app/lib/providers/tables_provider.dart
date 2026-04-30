import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/table_model.dart';
import '../repositories/tables_repository.dart';
import '../services/api_client.dart';
import 'auth_provider.dart';

// Tables Repository Provider
final tablesRepositoryProvider = Provider<TablesRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return TablesRepository(apiClient: apiClient);
});

// All Tables Provider
final tablesProvider = FutureProvider<List<TableData>>((ref) async {
  final repository = ref.watch(tablesRepositoryProvider);
  return repository.getAllTables();
});

// Available Tables Provider
final availableTablesProvider = FutureProvider<List<TableData>>((ref) async {
  final repository = ref.watch(tablesRepositoryProvider);
  return repository.getTablesByStatus(TableStatus.available);
});

// Occupied Tables Provider
final occupiedTablesProvider = FutureProvider<List<TableData>>((ref) async {
  final repository = ref.watch(tablesRepositoryProvider);
  return repository.getTablesByStatus(TableStatus.occupied);
});

// Single Table Provider
final singleTableProvider = FutureProvider.family<TableData, String>(
  (ref, tableId) async {
    final repository = ref.watch(tablesRepositoryProvider);
    return repository.getTable(tableId);
  },
);

// Table Filter Provider
final tableFilterProvider = StateProvider<TableStatus?>((ref) => null);

// Filtered Tables Provider
final filteredTablesProvider = FutureProvider<List<TableData>>((ref) async {
  final allTables = await ref.watch(tablesProvider.future);
  final filter = ref.watch(tableFilterProvider);

  if (filter == null) {
    return allTables;
  }

  return allTables.where((table) => table.status == filter).toList();
});
