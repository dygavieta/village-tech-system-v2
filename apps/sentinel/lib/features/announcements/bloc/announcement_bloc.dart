/**
 * Announcement BLoC for Sentinel app
 * Manages security announcements with realtime updates
 */

import 'package:bloc/bloc.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'announcement_event.dart';
import 'announcement_state.dart';

class AnnouncementBloc extends Bloc<AnnouncementEvent, AnnouncementState> {
  final SupabaseClient _supabase;
  RealtimeChannel? _announcementChannel;

  AnnouncementBloc({SupabaseClient? supabase})
      : _supabase = supabase ?? Supabase.instance.client,
        super(const AnnouncementInitial()) {
    on<LoadAnnouncementsEvent>(_onLoadAnnouncements);
    on<MarkAnnouncementReadEvent>(_onMarkAnnouncementRead);
    on<RefreshAnnouncementsEvent>(_onRefreshAnnouncements);

    _setupRealtimeSubscription();
  }

  /// Setup realtime subscription for new announcements
  void _setupRealtimeSubscription() {
    final currentUser = _supabase.auth.currentUser;
    if (currentUser == null) return;

    final tenantId = currentUser.userMetadata?['tenant_id'];
    if (tenantId == null) return;

    _announcementChannel = _supabase
        .channel('security_announcements')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'announcements',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'tenant_id',
            value: tenantId,
          ),
          callback: (payload) {
            // Reload announcements when new one is inserted
            add(const LoadAnnouncementsEvent());
          },
        )
        .subscribe();
  }

  /// Load all security announcements
  Future<void> _onLoadAnnouncements(
    LoadAnnouncementsEvent event,
    Emitter<AnnouncementState> emit,
  ) async {
    emit(const AnnouncementLoading());

    try {
      final currentUser = _supabase.auth.currentUser;
      if (currentUser == null) {
        emit(const AnnouncementError(message: 'User not authenticated'));
        return;
      }

      // Fetch announcements targeted to security
      final announcements = await _supabase
          .from('announcements')
          .select('''
            id,
            title,
            content,
            urgency,
            category,
            target_audience,
            effective_start,
            effective_end,
            requires_acknowledgment,
            attachment_urls,
            created_at,
            user_profiles!announcements_created_by_admin_id_fkey(first_name, last_name)
          ''')
          .inFilter('target_audience', ['all', 'all_security'])
          .or('effective_end.is.null,effective_end.gt.${DateTime.now().toIso8601String()}')
          .order('urgency', ascending: true) // critical first
          .order('created_at', ascending: false) as List<dynamic>;

      // Fetch acknowledgments to determine read status
      final acknowledgments = await _supabase
          .from('announcement_acknowledgments')
          .select('announcement_id, acknowledged_at')
          .eq('user_id', currentUser.id);

      final acknowledgedIds = acknowledgments
          .map((ack) => ack['announcement_id'] as String)
          .toSet();

      // Add read status to announcements
      final announcementsWithReadStatus = announcements.map((announcement) {
        return {
          ...announcement,
          'is_read': acknowledgedIds.contains(announcement['id']),
        };
      }).toList();

      // Sort: critical unread first, then by urgency and date
      announcementsWithReadStatus.sort((a, b) {
        // Critical unread first
        if (a['urgency'] == 'critical' && !(a['is_read'] as bool)) return -1;
        if (b['urgency'] == 'critical' && !(b['is_read'] as bool)) return 1;

        // Then by urgency
        final urgencyOrder = {'critical': 0, 'important': 1, 'info': 2};
        final urgencyCompare = (urgencyOrder[a['urgency']] ?? 3)
            .compareTo(urgencyOrder[b['urgency']] ?? 3);
        if (urgencyCompare != 0) return urgencyCompare;

        // Then by date
        final aDate = DateTime.parse(a['created_at']);
        final bDate = DateTime.parse(b['created_at']);
        return bDate.compareTo(aDate);
      });

      final unreadCount = announcementsWithReadStatus
          .where((a) => !(a['is_read'] as bool))
          .length;

      emit(AnnouncementLoaded(
        announcements: announcementsWithReadStatus.cast<Map<String, dynamic>>(),
        unreadCount: unreadCount,
        loadedAt: DateTime.now(),
      ));
    } on PostgrestException catch (e) {
      emit(AnnouncementError(message: 'Database error: ${e.message}'));
    } catch (e) {
      emit(AnnouncementError(message: 'Error loading announcements: ${e.toString()}'));
    }
  }

  /// Mark announcement as read
  Future<void> _onMarkAnnouncementRead(
    MarkAnnouncementReadEvent event,
    Emitter<AnnouncementState> emit,
  ) async {
    try {
      final currentUser = _supabase.auth.currentUser;
      if (currentUser == null) return;

      await _supabase.from('announcement_acknowledgments').upsert({
        'announcement_id': event.announcementId,
        'user_id': currentUser.id,
        'acknowledged_at': DateTime.now().toIso8601String(),
      });

      emit(AnnouncementMarkedRead(announcementId: event.announcementId));

      // Reload announcements to update counts
      add(const LoadAnnouncementsEvent());
    } catch (e) {
      // Silently fail acknowledgment
    }
  }

  /// Refresh announcements
  Future<void> _onRefreshAnnouncements(
    RefreshAnnouncementsEvent event,
    Emitter<AnnouncementState> emit,
  ) async {
    add(const LoadAnnouncementsEvent());
  }

  @override
  Future<void> close() {
    _announcementChannel?.unsubscribe();
    return super.close();
  }
}
