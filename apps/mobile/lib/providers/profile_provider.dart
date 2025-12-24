import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Profile page UI state
class ProfileState {
  final bool showCompanySwitcher;
  final bool isSwitching;

  const ProfileState({
    this.showCompanySwitcher = false,
    this.isSwitching = false,
  });

  ProfileState copyWith({
    bool? showCompanySwitcher,
    bool? isSwitching,
  }) {
    return ProfileState(
      showCompanySwitcher: showCompanySwitcher ?? this.showCompanySwitcher,
      isSwitching: isSwitching ?? this.isSwitching,
    );
  }
}

/// Profile state notifier
class ProfileNotifier extends Notifier<ProfileState> {
  @override
  ProfileState build() => const ProfileState();

  void setShowCompanySwitcher(bool value) {
    state = state.copyWith(showCompanySwitcher: value);
  }

  void setIsSwitching(bool value) {
    state = state.copyWith(isSwitching: value);
  }

  void reset() {
    state = const ProfileState();
  }
}

/// Profile state provider
final profileStateProvider = NotifierProvider<ProfileNotifier, ProfileState>(
  ProfileNotifier.new,
);

