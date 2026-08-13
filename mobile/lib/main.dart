import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app.dart';
import 'shared/services/connectivity_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  ConnectivityService().initialize();
  runApp(ProviderScope(child: ILabApp()));
}