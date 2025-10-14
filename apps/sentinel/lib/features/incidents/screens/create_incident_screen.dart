/**
 * Create Incident Screen for Sentinel app
 * Allows security guards to report incidents with photos, videos, and location
 */

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'dart:io';
import '../bloc/incident_bloc.dart';
import '../bloc/incident_event.dart';
import '../bloc/incident_state.dart';

class CreateIncidentScreen extends StatefulWidget {
  const CreateIncidentScreen({Key? key}) : super(key: key);

  @override
  State<CreateIncidentScreen> createState() => _CreateIncidentScreenState();
}

class _CreateIncidentScreenState extends State<CreateIncidentScreen> {
  final _formKey = GlobalKey<FormState>();
  final _descriptionController = TextEditingController();
  final _involvedPartiesController = TextEditingController();
  final _imagePicker = ImagePicker();

  String _selectedIncidentType = 'suspicious_person';
  String _selectedSeverity = 'medium';
  String _locationType = 'gate';
  String? _selectedLocationId;

  List<XFile> _selectedPhotos = [];
  List<String> _uploadedPhotoUrls = [];
  Map<String, dynamic>? _gpsCoordinates;
  bool _isUploading = false;

  final List<Map<String, String>> _incidentTypes = [
    {'value': 'suspicious_person', 'label': 'Suspicious Person'},
    {'value': 'theft', 'label': 'Theft'},
    {'value': 'vandalism', 'label': 'Vandalism'},
    {'value': 'noise_complaint', 'label': 'Noise Complaint'},
    {'value': 'medical_emergency', 'label': 'Medical Emergency'},
    {'value': 'fire', 'label': 'Fire'},
    {'value': 'other', 'label': 'Other'},
  ];

  final List<Map<String, dynamic>> _severityLevels = [
    {'value': 'low', 'label': 'Low', 'color': Colors.blue},
    {'value': 'medium', 'label': 'Medium', 'color': Colors.orange},
    {'value': 'high', 'label': 'High', 'color': Colors.deepOrange},
    {'value': 'critical', 'label': 'Critical', 'color': Colors.red},
  ];

  @override
  void initState() {
    super.initState();
    _captureGPSLocation();
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    _involvedPartiesController.dispose();
    super.dispose();
  }

  Future<void> _captureGPSLocation() async {
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.deniedForever) {
        return;
      }

      final position = await Geolocator.getCurrentPosition();
      setState(() {
        _gpsCoordinates = {
          'latitude': position.latitude,
          'longitude': position.longitude,
          'accuracy': position.accuracy,
          'timestamp': position.timestamp?.toIso8601String(),
        };
      });
    } catch (e) {
      // GPS capture failed, continue without it
    }
  }

  Future<void> _pickPhotos() async {
    try {
      final List<XFile> photos = await _imagePicker.pickMultiImage();
      if (photos.isNotEmpty) {
        setState(() {
          _selectedPhotos.addAll(photos);
        });
      }
    } catch (e) {
      _showErrorSnackbar('Error selecting photos: ${e.toString()}');
    }
  }

  Future<void> _takePhoto() async {
    try {
      final XFile? photo = await _imagePicker.pickImage(
        source: ImageSource.camera,
        preferredCameraDevice: CameraDevice.rear,
      );
      if (photo != null) {
        setState(() {
          _selectedPhotos.add(photo);
        });
      }
    } catch (e) {
      _showErrorSnackbar('Error taking photo: ${e.toString()}');
    }
  }

  void _removePhoto(int index) {
    setState(() {
      _selectedPhotos.removeAt(index);
    });
  }

  Future<void> _uploadPhotos() async {
    if (_selectedPhotos.isEmpty) return;

    setState(() {
      _isUploading = true;
    });

    try {
      final supabase = Supabase.instance.client;
      final userId = supabase.auth.currentUser?.id;

      for (final photo in _selectedPhotos) {
        final fileName = '${userId}_${DateTime.now().millisecondsSinceEpoch}_${photo.name}';
        final file = File(photo.path);

        final path = await supabase.storage
            .from('incident-evidence')
            .upload('incidents/$fileName', file);

        final url = supabase.storage
            .from('incident-evidence')
            .getPublicUrl('incidents/$fileName');

        _uploadedPhotoUrls.add(url);
      }

      setState(() {
        _isUploading = false;
      });
    } catch (e) {
      setState(() {
        _isUploading = false;
      });
      _showErrorSnackbar('Error uploading photos: ${e.toString()}');
    }
  }

  void _submitIncident() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_selectedLocationId == null) {
      _showErrorSnackbar('Please select a location');
      return;
    }

    // Upload photos first if any
    if (_selectedPhotos.isNotEmpty && _uploadedPhotoUrls.isEmpty) {
      await _uploadPhotos();
    }

    context.read<IncidentBloc>().add(CreateIncidentEvent(
      incidentType: _selectedIncidentType,
      locationGateId: _locationType == 'gate' ? _selectedLocationId : null,
      locationPropertyId: _locationType == 'property' ? _selectedLocationId : null,
      description: _descriptionController.text.trim(),
      severity: _selectedSeverity,
      photoUrls: _uploadedPhotoUrls,
      videoUrls: [], // Video support can be added later
      gpsCoordinates: _gpsCoordinates,
      involvedParties: _involvedPartiesController.text.trim().isEmpty
          ? null
          : _involvedPartiesController.text.trim(),
    ));
  }

  void _showErrorSnackbar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showSuccessSnackbar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Report Incident'),
        elevation: 2,
      ),
      body: BlocListener<IncidentBloc, IncidentState>(
        listener: (context, state) {
          if (state is IncidentCreated) {
            _showSuccessSnackbar('Incident reported successfully');
            Navigator.of(context).pop(true);
          } else if (state is IncidentError) {
            _showErrorSnackbar(state.message);
          }
        },
        child: BlocBuilder<IncidentBloc, IncidentState>(
          builder: (context, state) {
            final isLoading = state is IncidentLoading || _isUploading;

            return Stack(
              children: [
                Form(
                  key: _formKey,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // Incident Type
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Incident Type',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 12),
                              DropdownButtonFormField<String>(
                                value: _selectedIncidentType,
                                decoration: const InputDecoration(
                                  border: OutlineInputBorder(),
                                  contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                ),
                                items: _incidentTypes.map((type) {
                                  return DropdownMenuItem(
                                    value: type['value'],
                                    child: Text(type['label']!),
                                  );
                                }).toList(),
                                onChanged: (value) {
                                  setState(() {
                                    _selectedIncidentType = value!;
                                  });
                                },
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Severity Level
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Severity Level',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Wrap(
                                spacing: 8,
                                children: _severityLevels.map((severity) {
                                  final isSelected = _selectedSeverity == severity['value'];
                                  return ChoiceChip(
                                    label: Text(severity['label']),
                                    selected: isSelected,
                                    selectedColor: severity['color'],
                                    onSelected: (selected) {
                                      setState(() {
                                        _selectedSeverity = severity['value'];
                                      });
                                    },
                                  );
                                }).toList(),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Location
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Location',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: RadioListTile<String>(
                                      title: const Text('Gate'),
                                      value: 'gate',
                                      groupValue: _locationType,
                                      onChanged: (value) {
                                        setState(() {
                                          _locationType = value!;
                                          _selectedLocationId = null;
                                        });
                                      },
                                      contentPadding: EdgeInsets.zero,
                                    ),
                                  ),
                                  Expanded(
                                    child: RadioListTile<String>(
                                      title: const Text('Property'),
                                      value: 'property',
                                      groupValue: _locationType,
                                      onChanged: (value) {
                                        setState(() {
                                          _locationType = value!;
                                          _selectedLocationId = null;
                                        });
                                      },
                                      contentPadding: EdgeInsets.zero,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              TextFormField(
                                decoration: InputDecoration(
                                  labelText: _locationType == 'gate' ? 'Select Gate' : 'Property Address',
                                  border: const OutlineInputBorder(),
                                  hintText: 'Enter ${_locationType} identifier',
                                ),
                                validator: (value) {
                                  if (value == null || value.isEmpty) {
                                    return 'Location is required';
                                  }
                                  return null;
                                },
                                onChanged: (value) {
                                  _selectedLocationId = value;
                                },
                              ),
                              if (_gpsCoordinates != null) ...[
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    const Icon(Icons.location_on, size: 16, color: Colors.green),
                                    const SizedBox(width: 4),
                                    Text(
                                      'GPS: ${_gpsCoordinates!['latitude'].toStringAsFixed(6)}, ${_gpsCoordinates!['longitude'].toStringAsFixed(6)}',
                                      style: Theme.of(context).textTheme.bodySmall,
                                    ),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Description
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Description',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 12),
                              TextFormField(
                                controller: _descriptionController,
                                maxLines: 5,
                                decoration: const InputDecoration(
                                  border: OutlineInputBorder(),
                                  hintText: 'Describe the incident in detail...',
                                ),
                                validator: (value) {
                                  if (value == null || value.trim().isEmpty) {
                                    return 'Description is required';
                                  }
                                  if (value.trim().length < 10) {
                                    return 'Description must be at least 10 characters';
                                  }
                                  return null;
                                },
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Involved Parties
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Involved Parties (Optional)',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 12),
                              TextFormField(
                                controller: _involvedPartiesController,
                                maxLines: 2,
                                decoration: const InputDecoration(
                                  border: OutlineInputBorder(),
                                  hintText: 'Names or descriptions of people involved...',
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Photos
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Evidence Photos',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: OutlinedButton.icon(
                                      onPressed: _takePhoto,
                                      icon: const Icon(Icons.camera_alt),
                                      label: const Text('Take Photo'),
                                      style: OutlinedButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(vertical: 14),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: OutlinedButton.icon(
                                      onPressed: _pickPhotos,
                                      icon: const Icon(Icons.photo_library),
                                      label: const Text('Choose'),
                                      style: OutlinedButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(vertical: 14),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              if (_selectedPhotos.isNotEmpty) ...[
                                const SizedBox(height: 12),
                                SizedBox(
                                  height: 100,
                                  child: ListView.builder(
                                    scrollDirection: Axis.horizontal,
                                    itemCount: _selectedPhotos.length,
                                    itemBuilder: (context, index) {
                                      return Stack(
                                        children: [
                                          Container(
                                            margin: const EdgeInsets.only(right: 8),
                                            width: 100,
                                            decoration: BoxDecoration(
                                              border: Border.all(color: Colors.grey),
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            child: ClipRRect(
                                              borderRadius: BorderRadius.circular(8),
                                              child: Image.file(
                                                File(_selectedPhotos[index].path),
                                                fit: BoxFit.cover,
                                              ),
                                            ),
                                          ),
                                          Positioned(
                                            top: 4,
                                            right: 12,
                                            child: GestureDetector(
                                              onTap: () => _removePhoto(index),
                                              child: Container(
                                                padding: const EdgeInsets.all(4),
                                                decoration: const BoxDecoration(
                                                  color: Colors.red,
                                                  shape: BoxShape.circle,
                                                ),
                                                child: const Icon(
                                                  Icons.close,
                                                  size: 16,
                                                  color: Colors.white,
                                                ),
                                              ),
                                            ),
                                          ),
                                        ],
                                      );
                                    },
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Submit Button
                      ElevatedButton(
                        onPressed: isLoading ? null : _submitIncident,
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          backgroundColor: Theme.of(context).colorScheme.primary,
                        ),
                        child: isLoading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text(
                                'Submit Incident Report',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                              ),
                      ),
                      const SizedBox(height: 16),
                    ],
                  ),
                ),
                if (isLoading)
                  Container(
                    color: Colors.black26,
                    child: const Center(
                      child: CircularProgressIndicator(),
                    ),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }
}
