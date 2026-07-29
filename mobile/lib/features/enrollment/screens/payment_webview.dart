import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../../shared/theme/app_colors.dart';

class PaymentWebViewScreen extends StatefulWidget {
  final String paymentUrl;
  final String invoiceId;

  const PaymentWebViewScreen({
    super.key,
    required this.paymentUrl,
    required this.invoiceId,
  });

  @override
  State<PaymentWebViewScreen> createState() => _PaymentWebViewScreenState();
}

class _PaymentWebViewScreenState extends State<PaymentWebViewScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;
  bool _resolved = false;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) {
            if (!mounted) return;
            setState(() => _isLoading = true);
          },
          onPageFinished: (_) {
            if (!mounted) return;
            setState(() => _isLoading = false);
          },
          onNavigationRequest: (request) {
            _checkRedirect(request.url);
            return NavigationDecision.navigate;
          },
          onUrlChange: (change) {
            if (change.url != null) {
              _checkRedirect(change.url!);
            }
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.paymentUrl));
  }

  void _checkRedirect(String url) {
    if (_resolved) return;
    final uri = Uri.tryParse(url);
    if (uri == null) return;

    final path = uri.path;
    final queryParams = uri.queryParameters;
    final invoiceId = queryParams['invoice_id'] ?? widget.invoiceId;

    if (path.contains('uddoktapay/success') || path.contains('enroll/success') || url.contains('payment=success') || url.contains('payment=')) {
      if (path.contains('uddoktapay/success') || path.contains('enroll/success')) {
        _resolved = true;
        Navigator.of(context).pop({'success': true, 'invoice_id': invoiceId});
        return;
      }
      final paymentParam = queryParams['payment'];
      if (paymentParam == 'failed') {
        _resolved = true;
        Navigator.of(context).pop({'success': false, 'invoice_id': invoiceId, 'error': 'Payment failed.'});
        return;
      }
      if (paymentParam == 'pending') {
        _resolved = true;
        Navigator.of(context).pop({'success': true, 'invoice_id': invoiceId, 'pending': true});
        return;
      }
      if (paymentParam == 'cancelled') {
        _resolved = true;
        Navigator.of(context).pop({'success': false, 'cancelled': true, 'invoice_id': invoiceId});
        return;
      }
    }

    if (path.contains('uddoktapay/cancel') || url.contains('payment=cancelled')) {
      _resolved = true;
      Navigator.of(context).pop({'success': false, 'cancelled': true, 'invoice_id': invoiceId});
      return;
    }

    final query = uri.query;
    if (query.contains('payment=failed') || query.contains('payment=invalid')) {
      _resolved = true;
      Navigator.of(context).pop({'success': false, 'invoice_id': invoiceId, 'error': 'Payment was not completed.'});
      return;
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !_resolved,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop && !_resolved) {
          _resolved = true;
          Navigator.of(context).pop({'success': false, 'cancelled': true, 'invoice_id': widget.invoiceId});
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Payment'),
          leading: IconButton(
            icon: const Icon(Icons.close),
            onPressed: () {
              if (!_resolved) {
                _resolved = true;
                Navigator.of(context).pop({'success': false, 'cancelled': true, 'invoice_id': widget.invoiceId});
              }
            },
          ),
          backgroundColor: AppColors.card,
          surfaceTintColor: AppColors.card,
        ),
        body: Stack(
          children: [
            WebViewWidget(controller: _controller),
            if (_isLoading)
              const LinearProgressIndicator(),
          ],
        ),
      ),
    );
  }
}