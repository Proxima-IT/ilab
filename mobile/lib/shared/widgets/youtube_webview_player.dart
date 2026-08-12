import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class YoutubeWebViewPlayer extends StatefulWidget {
  final String videoEmbedUrl;
  final int watchSeconds;
  final VoidCallback? onReady;
  final VoidCallback? onPlay;
  final VoidCallback? onPause;
  final VoidCallback? onEnded;
  final Function(int seconds)? onTimeUpdate;
  final bool showControls;
  final bool autoPlay;

  const YoutubeWebViewPlayer({
    super.key,
    required this.videoEmbedUrl,
    this.watchSeconds = 0,
    this.onReady,
    this.onPlay,
    this.onPause,
    this.onEnded,
    this.onTimeUpdate,
    this.showControls = true,
    this.autoPlay = false,
  });

  @override
  State<YoutubeWebViewPlayer> createState() => YoutubeWebViewPlayerState();
}

class YoutubeWebViewPlayerState extends State<YoutubeWebViewPlayer> {
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();
    _initController();
  }

  String _extractVideoId(String url) {
    final uri = Uri.tryParse(url);
    if (uri == null) return url;

    if (uri.pathSegments.isNotEmpty && uri.pathSegments.first == 'embed') {
      return uri.pathSegments.last;
    }

    if (uri.queryParameters.containsKey('v')) {
      return uri.queryParameters['v']!;
    }

    return url;
  }

  void _initController() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setUserAgent(
          'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36')
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: (NavigationRequest request) {
            final url = request.url;
            if (url.startsWith('about:blank') ||
                url.startsWith('data:text/html') ||
                url.startsWith('data:') ||
                url.contains('youtube.com') ||
                url.contains('youtu.be') ||
                url.contains('google.com')) {
              return NavigationDecision.navigate;
            }
            return NavigationDecision.prevent;
          },
        ),
      )
      ..addJavaScriptChannel(
        'Flutter',
        onMessageReceived: _onJavaScriptMessage,
      )
      ..loadHtmlString(
        _buildHtml(),
        baseUrl: 'https://ilabbd.com',
      );
  }

  String _buildHtml() {
    final videoId = _extractVideoId(widget.videoEmbedUrl);
    final autoplay = widget.autoPlay ? 1 : 0;
    final controls = widget.showControls ? 1 : 0;

    return '''
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <style>
    * { margin: 0; padding: 0; }
    body { background: #000; }
    #player { width: 100%; height: 100vh; }
  </style>
</head>
<body>
  <div id="player"></div>
  <script>
    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    var player;
    var watchSeconds = ${widget.watchSeconds};
    var timeUpdateInterval;

    function onYouTubeIframeAPIReady() {
      player = new YT.Player('player', {
        videoId: '$videoId',
        playerVars: {
          autoplay: $autoplay,
          controls: $controls,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
          origin: 'https://ilabbd.com',
          host: 'https://www.youtube-nocookie.com'
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
          onError: onPlayerError
        }
      });
    }

    function onPlayerReady(event) {
      if (watchSeconds > 0) {
        player.seekTo(watchSeconds, true);
      }
      Flutter.postMessage(JSON.stringify({ event: 'ready' }));

      timeUpdateInterval = setInterval(function() {
        if (player && player.getCurrentTime) {
          var currentTime = Math.floor(player.getCurrentTime());
          Flutter.postMessage(JSON.stringify({
            event: 'timeUpdate',
            data: { currentTime: currentTime }
          }));
        }
      }, 1000);
    }

    function onPlayerStateChange(event) {
      switch(event.data) {
        case YT.PlayerState.PLAYING:
          Flutter.postMessage(JSON.stringify({ event: 'play' }));
          break;
        case YT.PlayerState.PAUSED:
          Flutter.postMessage(JSON.stringify({ event: 'pause' }));
          break;
        case YT.PlayerState.ENDED:
          clearInterval(timeUpdateInterval);
          Flutter.postMessage(JSON.stringify({ event: 'ended' }));
          break;
      }
    }

    function onPlayerError(event) {
      Flutter.postMessage(JSON.stringify({
        event: 'error',
        data: { errorCode: event.data }
      }));
    }

    function playerPlay() {
      if (player && player.playVideo) {
        player.playVideo();
      }
    }

    function playerPause() {
      if (player && player.pauseVideo) {
        player.pauseVideo();
      }
    }

    function playerSeekTo(seconds) {
      if (player && player.seekTo) {
        player.seekTo(seconds, true);
      }
    }
  </script>
</body>
</html>
''';
  }

  void _onJavaScriptMessage(JavaScriptMessage message) {
    try {
      final payload = jsonDecode(message.message) as Map<String, dynamic>;
      final event = payload['event'] as String?;
      final data = payload['data'] as Map<String, dynamic>?;

      switch (event) {
        case 'ready':
          if (widget.watchSeconds > 0) {
            _controller.runJavaScript('playerSeekTo(${widget.watchSeconds});');
          }
          if (widget.autoPlay) {
            _controller.runJavaScript('playerPlay();');
          }
          widget.onReady?.call();
        case 'play':
          widget.onPlay?.call();
        case 'pause':
          widget.onPause?.call();
        case 'ended':
          widget.onEnded?.call();
        case 'error':
        case 'timeUpdate':
          if (data != null) {
            final currentTime = (data['currentTime'] as num).toInt();
            widget.onTimeUpdate?.call(currentTime);
          }
      }
    } catch (_) {}
  }

  Future<void> play() async {
    await _controller.runJavaScript('playerPlay()');
  }

  Future<void> pause() async {
    await _controller.runJavaScript('playerPause()');
  }

  Future<void> seekTo(int seconds) async {
    await _controller.runJavaScript('playerSeekTo($seconds)');
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return WebViewWidget(controller: _controller);
  }
}