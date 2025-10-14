/**
 * Incidents List Screen for Sentinel app
 * Displays all incidents reported by current guard with filtering
 */

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../bloc/incident_bloc.dart';
import '../bloc/incident_event.dart';
import '../bloc/incident_state.dart';
import 'create_incident_screen.dart';

class IncidentsScreen extends StatefulWidget {
  const IncidentsScreen({Key? key}) : super(key: key);

  @override
  State<IncidentsScreen> createState() => _IncidentsScreenState();
}

class _IncidentsScreenState extends State<IncidentsScreen> {
  String? _severityFilter;
  String? _statusFilter;
  DateTime? _startDate;
  DateTime? _endDate;

  @override
  void initState() {
    super.initState();
    _loadIncidents();
  }

  void _loadIncidents() {
    context.read<IncidentBloc>().add(LoadIncidentsEvent(
      severityFilter: _severityFilter,
      statusFilter: _statusFilter,
      startDate: _startDate,
      endDate: _endDate,
    ));
  }

  void _showFilterDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Filter Incidents'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Severity filter
              const Text('Severity', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: [
                  FilterChip(
                    label: const Text('All'),
                    selected: _severityFilter == null,
                    onSelected: (selected) {
                      setState(() {
                        _severityFilter = null;
                      });
                    },
                  ),
                  FilterChip(
                    label: const Text('Low'),
                    selected: _severityFilter == 'low',
                    onSelected: (selected) {
                      setState(() {
                        _severityFilter = selected ? 'low' : null;
                      });
                    },
                  ),
                  FilterChip(
                    label: const Text('Medium'),
                    selected: _severityFilter == 'medium',
                    onSelected: (selected) {
                      setState(() {
                        _severityFilter = selected ? 'medium' : null;
                      });
                    },
                  ),
                  FilterChip(
                    label: const Text('High'),
                    selected: _severityFilter == 'high',
                    onSelected: (selected) {
                      setState(() {
                        _severityFilter = selected ? 'high' : null;
                      });
                    },
                  ),
                  FilterChip(
                    label: const Text('Critical'),
                    selected: _severityFilter == 'critical',
                    onSelected: (selected) {
                      setState(() {
                        _severityFilter = selected ? 'critical' : null;
                      });
                    },
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Status filter
              const Text('Status', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: [
                  FilterChip(
                    label: const Text('All'),
                    selected: _statusFilter == null,
                    onSelected: (selected) {
                      setState(() {
                        _statusFilter = null;
                      });
                    },
                  ),
                  FilterChip(
                    label: const Text('Reported'),
                    selected: _statusFilter == 'reported',
                    onSelected: (selected) {
                      setState(() {
                        _statusFilter = selected ? 'reported' : null;
                      });
                    },
                  ),
                  FilterChip(
                    label: const Text('Responding'),
                    selected: _statusFilter == 'responding',
                    onSelected: (selected) {
                      setState(() {
                        _statusFilter = selected ? 'responding' : null;
                      });
                    },
                  ),
                  FilterChip(
                    label: const Text('Resolved'),
                    selected: _statusFilter == 'resolved',
                    onSelected: (selected) {
                      setState(() {
                        _statusFilter = selected ? 'resolved' : null;
                      });
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () {
              setState(() {
                _severityFilter = null;
                _statusFilter = null;
                _startDate = null;
                _endDate = null;
              });
              Navigator.pop(context);
              _loadIncidents();
            },
            child: const Text('Clear'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _loadIncidents();
            },
            child: const Text('Apply'),
          ),
        ],
      ),
    );
  }

  Color _getSeverityColor(String severity) {
    switch (severity) {
      case 'low':
        return Colors.blue;
      case 'medium':
        return Colors.orange;
      case 'high':
        return Colors.deepOrange;
      case 'critical':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'reported':
        return Colors.orange;
      case 'responding':
        return Colors.blue;
      case 'resolved':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  String _getIncidentTypeLabel(String type) {
    switch (type) {
      case 'suspicious_person':
        return 'Suspicious Person';
      case 'theft':
        return 'Theft';
      case 'vandalism':
        return 'Vandalism';
      case 'noise_complaint':
        return 'Noise Complaint';
      case 'medical_emergency':
        return 'Medical Emergency';
      case 'fire':
        return 'Fire';
      case 'other':
        return 'Other';
      default:
        return type;
    }
  }

  void _navigateToCreateIncident() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => BlocProvider.value(
          value: context.read<IncidentBloc>(),
          child: const CreateIncidentScreen(),
        ),
      ),
    );

    if (result == true) {
      _loadIncidents();
    }
  }

  void _showIncidentDetails(Map<String, dynamic> incident) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.95,
        minChildSize: 0.5,
        expand: false,
        builder: (context, scrollController) => Container(
          padding: const EdgeInsets.all(16),
          child: ListView(
            controller: scrollController,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    _getIncidentTypeLabel(incident['incident_type']),
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const Divider(),
              const SizedBox(height: 8),

              // Severity and Status
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: _getSeverityColor(incident['severity']).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: _getSeverityColor(incident['severity'])),
                    ),
                    child: Text(
                      incident['severity'].toString().toUpperCase(),
                      style: TextStyle(
                        color: _getSeverityColor(incident['severity']),
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: _getStatusColor(incident['status']).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: _getStatusColor(incident['status'])),
                    ),
                    child: Text(
                      incident['status'].toString().toUpperCase(),
                      style: TextStyle(
                        color: _getStatusColor(incident['status']),
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Timestamp
              _buildInfoRow(Icons.access_time, 'Reported',
                  DateFormat('MMM dd, yyyy HH:mm').format(DateTime.parse(incident['created_at']))),
              const SizedBox(height: 8),

              // Location
              if (incident['location_gate_id'] != null && incident['gates'] != null)
                _buildInfoRow(Icons.location_on, 'Location',
                    'Gate: ${incident['gates']['name']}'),
              if (incident['location_property_id'] != null && incident['properties'] != null)
                _buildInfoRow(Icons.home, 'Location',
                    'Property: ${incident['properties']['address']}'),
              const SizedBox(height: 16),

              // Description
              Text(
                'Description',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(incident['description']),
              const SizedBox(height: 16),

              // Evidence Photos
              if (incident['evidence_photo_urls'] != null &&
                  (incident['evidence_photo_urls'] as List).isNotEmpty) ...[
                Text(
                  'Evidence Photos',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  height: 120,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: (incident['evidence_photo_urls'] as List).length,
                    itemBuilder: (context, index) {
                      final url = (incident['evidence_photo_urls'] as List)[index];
                      return Container(
                        margin: const EdgeInsets.only(right: 8),
                        width: 120,
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.grey),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(
                            url,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) =>
                                const Icon(Icons.error),
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Resolution
              if (incident['status'] == 'resolved') ...[
                Text(
                  'Resolution',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                if (incident['resolved_at'] != null)
                  _buildInfoRow(Icons.check_circle, 'Resolved At',
                      DateFormat('MMM dd, yyyy HH:mm').format(DateTime.parse(incident['resolved_at']))),
                if (incident['resolution_notes'] != null) ...[
                  const SizedBox(height: 8),
                  Text(incident['resolution_notes']),
                ],
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: Colors.grey[600]),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Incidents'),
        elevation: 2,
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: _showFilterDialog,
          ),
        ],
      ),
      body: BlocBuilder<IncidentBloc, IncidentState>(
        builder: (context, state) {
          if (state is IncidentLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state is IncidentError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
                  const SizedBox(height: 16),
                  Text(
                    state.message,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 16),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _loadIncidents,
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          if (state is IncidentLoaded) {
            final incidents = state.incidents;

            if (incidents.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.report_off, size: 64, color: Colors.grey[400]),
                    const SizedBox(height: 16),
                    Text(
                      'No incidents reported yet',
                      style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Tap the + button to report an incident',
                      style: TextStyle(fontSize: 14, color: Colors.grey[500]),
                    ),
                  ],
                ),
              );
            }

            return RefreshIndicator(
              onRefresh: () async {
                context.read<IncidentBloc>().add(const RefreshIncidentsEvent());
              },
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: incidents.length,
                itemBuilder: (context, index) {
                  final incident = incidents[index];
                  final severityColor = _getSeverityColor(incident['severity']);
                  final statusColor = _getStatusColor(incident['status']);

                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: InkWell(
                      onTap: () => _showIncidentDetails(incident),
                      borderRadius: BorderRadius.circular(12),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Header row
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    _getIncidentTypeLabel(incident['incident_type']),
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                Container(
                                  width: 8,
                                  height: 8,
                                  decoration: BoxDecoration(
                                    color: severityColor,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),

                            // Description
                            Text(
                              incident['description'],
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey[700],
                              ),
                            ),
                            const SizedBox(height: 12),

                            // Footer row
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: severityColor.withOpacity(0.2),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        incident['severity'],
                                        style: TextStyle(
                                          color: severityColor,
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: statusColor.withOpacity(0.2),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        incident['status'],
                                        style: TextStyle(
                                          color: statusColor,
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                Text(
                                  DateFormat('MMM dd, HH:mm')
                                      .format(DateTime.parse(incident['created_at'])),
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey[600],
                                  ),
                                ),
                              ],
                            ),

                            // Location
                            if (incident['location_gate_id'] != null &&
                                incident['gates'] != null) ...[
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Icon(Icons.location_on,
                                      size: 14, color: Colors.grey[600]),
                                  const SizedBox(width: 4),
                                  Text(
                                    'Gate: ${incident['gates']['name']}',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey[600],
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            );
          }

          return const SizedBox.shrink();
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _navigateToCreateIncident,
        icon: const Icon(Icons.add),
        label: const Text('Report Incident'),
      ),
    );
  }
}
