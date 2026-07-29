import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../config/api_config.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/theme/app_text_styles.dart';
import '../../../shared/services/api_client.dart';

class NotificationSettingsScreen extends ConsumerStatefulWidget {
  const NotificationSettingsScreen({super.key});

  @override
  ConsumerState<NotificationSettingsScreen> createState() => _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState extends ConsumerState<NotificationSettingsScreen> {
  final ApiClient _api = ApiClient();
  bool _isLoading = true;
  bool _isSaving = false;
  Map<String, bool> _settings = {};

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    setState(() => _isLoading = true);
    try {
      final response = await _api.get(ApiConfig.notificationSettings);
      final data = response.data as Map<String, dynamic>;
      final responseData = data['data'] as Map<String, dynamic>? ?? data;
      setState(() {
        _settings = {
          'email': responseData['email'] as bool? ?? true,
          'push': responseData['push'] as bool? ?? true,
          'new_lecture': responseData['new_lecture'] as bool? ?? true,
          'special_offer': responseData['special_offer'] as bool? ?? true,
          'event': responseData['event'] as bool? ?? true,
          'profile_update': responseData['profile_update'] as bool? ?? true,
          'course_completion': responseData['course_completion'] as bool? ?? true,
          'certificate_ready': responseData['certificate_ready'] as bool? ?? true,
          'admin_message': responseData['admin_message'] as bool? ?? true,
          'qna_answer': responseData['qna_answer'] as bool? ?? true,
          'sms': responseData['sms'] as bool? ?? false,
        };
      });
    } catch (_) {
      setState(() {
        _settings = {
          'email': true,
          'push': true,
          'new_lecture': true,
          'special_offer': true,
          'event': true,
          'profile_update': true,
          'course_completion': true,
          'certificate_ready': true,
          'admin_message': true,
          'qna_answer': true,
          'sms': false,
        };
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _handleSave() async {
    setState(() => _isSaving = true);
    try {
      await _api.put(ApiConfig.notificationSettings, data: _settings);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Notification settings saved.')),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        final message = (e is DioException && e.response?.data is Map)
            ? ((e.response!.data as Map)['message'] as String? ?? 'Failed to save settings.')
            : 'Failed to save settings.';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message)),
        );
      }
    } finally {
      setState(() => _isSaving = false);
    }
  }

  void _toggle(String key) {
    setState(() {
      _settings[key] = !(_settings[key] ?? false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notification Settings')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Card(
                  elevation: 0,
                  color: AppColors.card,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: BorderSide(color: AppColors.border.withValues(alpha: 0.5)),
                  ),
                  child: Column(
                    children: [
                      _buildToggleTile(Icons.email, 'Email notifications', 'email'),
                      const Divider(height: 1, indent: 56),
                      _buildToggleTile(Icons.smartphone, 'Push notifications', 'push'),
                      const Divider(height: 1, indent: 56),
                      _buildToggleTile(Icons.notifications_active, 'New lecture added', 'new_lecture'),
                      const Divider(height: 1, indent: 56),
                      _buildToggleTile(Icons.local_offer, 'Special offers', 'special_offer'),
                      const Divider(height: 1, indent: 56),
                      _buildToggleTile(Icons.event, 'Events', 'event'),
                      const Divider(height: 1, indent: 56),
                      _buildToggleTile(Icons.person, 'Profile updates', 'profile_update'),
                      const Divider(height: 1, indent: 56),
                      _buildToggleTile(Icons.check_circle, 'Course completion', 'course_completion'),
                      const Divider(height: 1, indent: 56),
                      _buildToggleTile(Icons.workspace_premium, 'Certificate ready', 'certificate_ready'),
                      const Divider(height: 1, indent: 56),
                      _buildToggleTile(Icons.message, 'Admin messages', 'admin_message'),
                      const Divider(height: 1, indent: 56),
                      _buildToggleTile(Icons.help, 'Q&A answers', 'qna_answer'),
                      const Divider(height: 1, indent: 56),
                      _buildToggleTile(Icons.sms, 'SMS notifications', 'sms'),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppColors.primary, AppColors.primaryDark],
                        begin: Alignment.centerLeft,
                        end: Alignment.centerRight,
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: FilledButton(
                      onPressed: _isSaving ? null : _handleSave,
                      style: FilledButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _isSaving
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : Text('Save Changes', style: AppTextStyles.buttonMedium),
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildToggleTile(IconData icon, String label, String key) {
    final value = _settings[key] ?? false;
    return ListTile(
      leading: Icon(icon, color: AppColors.primary, size: 22),
      title: Text(
        label,
        style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w500),
      ),
      trailing: Switch(
        value: value,
        onChanged: _isSaving ? null : (_) => _toggle(key),
        activeColor: AppColors.primary,
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    );
  }
}