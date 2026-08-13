import '../../config/api_config.dart';

class UserModel {
  final int id;
  final String name;
  final String? phone;
  final String email;
  final String? token;
  final String? profilePhoto;
  final String? bio;
  final String? district;
  final String? educationLevel;
  final String? provider;

  bool get isGoogleAccount => provider == 'google';

  const UserModel({
    required this.id,
    required this.name,
    this.phone,
    required this.email,
    this.token,
    this.profilePhoto,
    this.bio,
    this.district,
    this.educationLevel,
    this.provider,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final rawAvatar = json['avatar'] as String? ??
        json['profile_photo'] as String? ??
        json['avatar_url'] as String?;
    final resolvedAvatar = ApiConfig.resolveImageUrl(rawAvatar);

    return UserModel(
      id: json['id'] as int,
      name: json['name'] as String? ?? '',
      phone: json['phone'] as String?,
      email: json['email'] as String? ?? '',
      token: json['token'] as String?,
      profilePhoto: resolvedAvatar,
      bio: json['bio'] as String?,
      district: json['district'] as String?,
      educationLevel: json['education_level'] as String?,
      provider: json['provider'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'email': email,
      'token': token,
      'profile_photo': profilePhoto,
      'bio': bio,
      'district': district,
      'education_level': educationLevel,
      'provider': provider,
    };
  }

  UserModel copyWith({
    int? id,
    String? name,
    String? phone,
    String? email,
    String? token,
    String? profilePhoto,
    String? bio,
    String? district,
    String? educationLevel,
    String? provider,
  }) {
    return UserModel(
      id: id ?? this.id,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      token: token ?? this.token,
      profilePhoto: profilePhoto ?? this.profilePhoto,
      bio: bio ?? this.bio,
      district: district ?? this.district,
      educationLevel: educationLevel ?? this.educationLevel,
      provider: provider ?? this.provider,
    );
  }
}