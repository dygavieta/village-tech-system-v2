import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../providers/permit_provider.dart';
import '../models/construction_permit.dart';
import 'request_permit_screen.dart';

class PermitsScreen extends ConsumerStatefulWidget {
  const PermitsScreen({super.key});

  @override
  ConsumerState<PermitsScreen> createState() => _PermitsScreenState();
}

class _PermitsScreenState extends ConsumerState<PermitsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final permitsAsync = ref.watch(permitsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Construction Permits'),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/services'),
        ),
      ),
      body: permitsAsync.when(
        data: (permits) {
          // Active permits: Only fully active permits (approved AND paid)
          final activePermits = permits
              .where((p) => p.permitStatus == PermitStatus.active)
              .toList();

          // Pending permits: Awaiting approval, awaiting payment, or on hold
          final pendingPermits = permits
              .where((p) =>
                  p.permitStatus == PermitStatus.pendingApproval ||
                  (p.permitStatus == PermitStatus.approved && p.paymentStatus == 'pending') ||
                  p.permitStatus == PermitStatus.onHold)
              .toList();

          return Column(
            children: [
              // Hero Banner
              _buildHeroBanner(context),
              const SizedBox(height: 16),

              // Tab Bar
              Container(
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: Theme.of(context).colorScheme.outlineVariant,
                    ),
                  ),
                ),
                child: TabBar(
                  controller: _tabController,
                  indicatorColor: Theme.of(context).colorScheme.primary,
                  indicatorSize: TabBarIndicatorSize.tab,
                  indicatorWeight: 2,
                  labelColor: Theme.of(context).colorScheme.primary,
                  unselectedLabelColor:
                      Theme.of(context).colorScheme.onSurfaceVariant,
                  labelStyle: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                  unselectedLabelStyle: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                  tabs: const [
                    Tab(text: 'Active Permits'),
                    Tab(text: 'Pending Permits'),
                  ],
                ),
              ),

              // Tab View
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildPermitList(activePermits, isActive: true),
                    _buildPermitList(pendingPermits, isActive: false),
                  ],
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 60, color: Colors.red),
              const SizedBox(height: 16),
              Text('Error: $error'),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => ref.refresh(permitsProvider),
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeroBanner(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          // Banner Image
          Container(
            height: 192,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              image: const DecorationImage(
                image: NetworkImage(
                  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=400&fit=crop',
                ),
                fit: BoxFit.cover,
              ),
            ),
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withOpacity(0.7),
                  ],
                ),
              ),
              padding: const EdgeInsets.all(24),
              alignment: Alignment.bottomLeft,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Request a new construction permit',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Get a new permit for your construction.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.white70,
                        ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Request Button
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () async {
                final result = await Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (context) => const RequestPermitScreen()),
                );
                if (result == true) {
                  ref.refresh(permitsProvider);
                }
              },
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Text(
                'Request Permit',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPermitList(List<ConstructionPermit> permits,
      {required bool isActive}) {
    if (permits.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.construction_outlined,
                size: 64,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
              const SizedBox(height: 16),
              Text(
                isActive ? 'No Active Permits' : 'No Pending Permits',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text(
                isActive
                    ? 'You don\'t have any active construction permits yet'
                    : 'You don\'t have any pending permit requests',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return Container(
      color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.3),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: permits.length,
        itemBuilder: (context, index) {
          final permit = permits[index];
          return _PermitCard(permit: permit);
        },
      ),
    );
  }
}

class _PermitCard extends StatelessWidget {
  final ConstructionPermit permit;

  const _PermitCard({required this.permit});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with category badge and menu
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildCategoryBadge(context, permit.projectType),
                IconButton(
                  icon: Icon(
                    Icons.more_vert,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                  onPressed: () {
                    // TODO: Show menu options
                  },
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Title/Description
            Text(
              permit.description,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 16),

            // Details with icons
            _buildDetailRow(
              context,
              Icons.calendar_today,
              '${permit.durationDays} Days',
            ),
            const SizedBox(height: 12),
            _buildDetailRow(
              context,
              Icons.schedule,
              'Starts: ${_formatDate(permit.startDate)}',
            ),
            const SizedBox(height: 12),
            _buildDetailRow(
              context,
              Icons.engineering,
              'Contractor: ${permit.contractorName ?? 'N/A'}',
            ),

            // Show payment status if approved but not paid
            if (permit.permitStatus == PermitStatus.approved &&
                permit.paymentStatus == 'pending') ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.warning.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.warning.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.payment,
                      size: 20,
                      color: AppColors.warning,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Payment Required - Permit approved, awaiting payment',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.warning,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryBadge(BuildContext context, String projectType) {
    Color backgroundColor;
    Color textColor;
    String label;

    switch (projectType.toLowerCase()) {
      case 'renovation':
        backgroundColor = AppColors.categoryRepair.withOpacity(0.1);
        textColor = AppColors.categoryRepair;
        label = 'RENOVATION';
        break;
      case 'landscaping':
        backgroundColor = AppColors.categoryLandscaping.withOpacity(0.1);
        textColor = AppColors.categoryLandscaping;
        label = 'LANDSCAPING';
        break;
      case 'repair':
        backgroundColor = AppColors.categoryRenovation.withOpacity(0.1);
        textColor = AppColors.categoryRenovation;
        label = 'REPAIR';
        break;
      case 'new_construction':
        backgroundColor = AppColors.categoryNewConstruction.withOpacity(0.1);
        textColor = AppColors.categoryNewConstruction;
        label = 'NEW CONSTRUCTION';
        break;
      default:
        backgroundColor = AppColors.grey(100);
        textColor = AppColors.grey(700);
        label = projectType.toUpperCase();
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.bold,
          color: textColor,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildDetailRow(BuildContext context, IconData icon, String text) {
    return Row(
      children: [
        Icon(
          icon,
          size: 18,
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        ),
        const SizedBox(width: 8),
        Text(
          text,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
        ),
      ],
    );
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
}
