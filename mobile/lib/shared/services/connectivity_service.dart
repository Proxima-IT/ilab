import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_colors.dart';

class ConnectivityService {
  static final ConnectivityService _instance = ConnectivityService._internal();
  static ConnectivityService get instance => _instance;
  factory ConnectivityService() => _instance;
  ConnectivityService._internal();

  final Connectivity _connectivity = Connectivity();
  StreamSubscription<List<ConnectivityResult>>? _subscription;
  OverlayEntry? _overlayEntry;

  void initialize() {
    print('ConnectivityService: Initialized');
    _subscription = _connectivity.onConnectivityChanged.listen(_onConnectivityChanged);
    _connectivity.checkConnectivity().then(_onConnectivityChanged);
  }

  void _onConnectivityChanged(List<ConnectivityResult> results) {
    final isConnected = results.any((r) => r != ConnectivityResult.none);
    print('ConnectivityService: Status changed to $results');

    if (isConnected) {
      _removeOverlay();
    } else {
      showOverlay();
    }
  }

  void showOverlay() {
    if (_overlayEntry != null) return;
    print('ConnectivityService: Showing overlay');

    _overlayEntry = OverlayEntry(
      builder: (context) => _OfflineOverlay(),
    );

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_overlayEntry != null) {
        navigatorKey.currentState?.overlay?.insert(_overlayEntry!);
      }
    });
  }

  void _removeOverlay() {
    if (_overlayEntry == null) return;
    print('ConnectivityService: Hiding overlay');
    _overlayEntry?.remove();
    _overlayEntry = null;
  }

  void closeApp() {
    SystemNavigator.pop();
  }

  void dispose() {
    _removeOverlay();
    _subscription?.cancel();
  }

  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
}

class _OfflineOverlay extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      child: Material(
        color: Colors.black54,
        child: Center(
          child: Container(
            margin: const EdgeInsets.all(32),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.wifi_off, size: 64, color: Colors.red.shade400),
                const SizedBox(height: 16),
                const Text(
                  'No Internet Connection',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Please check your internet and try again.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 14, color: Colors.grey),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => ConnectivityService.instance.closeApp(),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: const StadiumBorder(),
                      backgroundColor: AppColors.primary,
                      foregroundColor: AppColors.white,
                    ),
                    child: const Text(
                      'Close App',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}