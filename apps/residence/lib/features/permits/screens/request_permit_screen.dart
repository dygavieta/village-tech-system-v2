import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import '../models/construction_permit.dart';
import '../providers/permit_provider.dart';
import '../../household/providers/member_provider.dart';

class RequestPermitScreen extends ConsumerStatefulWidget {
  const RequestPermitScreen({super.key});

  @override
  ConsumerState<RequestPermitScreen> createState() => _RequestPermitScreenState();
}

class _RequestPermitScreenState extends ConsumerState<RequestPermitScreen> {
  final _formKey = GlobalKey<FormState>();
  final _descriptionController = TextEditingController();
  final _contractorController = TextEditingController();
  final _workersController = TextEditingController(text: '1');
  final _materialsController = TextEditingController();

  String _projectType = 'renovation';
  DateTime _startDate = DateTime.now().add(const Duration(days: 7));
  int _durationDays = 30;
  String? _documentPath;
  String? _documentName;
  bool _isSubmitting = false;

  final List<String> _projectTypes = ['renovation', 'addition', 'repair', 'landscaping'];

  @override
  void dispose() {
    _descriptionController.dispose();
    _contractorController.dispose();
    _workersController.dispose();
    _materialsController.dispose();
    super.dispose();
  }

  Future<void> _pickDocument() async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
      );

      if (result != null && result.files.single.path != null) {
        setState(() {
          _documentPath = result.files.single.path;
          _documentName = result.files.single.name;
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error picking file: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _startDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (picked != null) {
      setState(() => _startDate = picked);
    }
  }

  Future<void> _submitRequest() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      String? documentUrl;
      if (_documentPath != null) {
        documentUrl = await ref
            .read(permitNotifierProvider.notifier)
            .uploadDocument(_documentPath!, _documentName!);
      }

      final householdId = await ref.read(currentHouseholdIdProvider.future);

      final permit = ConstructionPermit(
        id: '',
        householdId: householdId,
        projectType: _projectType,
        description: _descriptionController.text.trim(),
        startDate: _startDate,
        durationDays: _durationDays,
        contractorName: _contractorController.text.trim().isNotEmpty ? _contractorController.text.trim() : null,
        contractorLicenseUrl: documentUrl,
        numWorkers: int.tryParse(_workersController.text) ?? 1,
        materialsDescription: _materialsController.text.trim().isNotEmpty ? _materialsController.text.trim() : null,
        roadFeeAmount: 0.0,  // Will be set by admin
        paymentStatus: 'pending',
        permitStatus: PermitStatus.pendingApproval,
        createdAt: DateTime.now(),
      );

      await ref.read(permitNotifierProvider.notifier).requestPermit(permit);

      if (!mounted) return;

      final state = ref.read(permitNotifierProvider);

      state.when(
        data: (_) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Permit request submitted successfully'), backgroundColor: Colors.green),
          );
          Navigator.pop(context, true);
        },
        loading: () {},
        error: (error, _) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $error'), backgroundColor: Colors.red),
          );
          setState(() => _isSubmitting = false);
        },
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
      setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Request Construction Permit'), elevation: 0),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Project Details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              DropdownButtonFormField<String>(
                value: _projectType,
                decoration: const InputDecoration(labelText: 'Project Type', prefixIcon: Icon(Icons.category), border: OutlineInputBorder()),
                items: _projectTypes.map((type) => DropdownMenuItem(value: type, child: Text(_capitalizeFirst(type)))).toList(),
                onChanged: (value) => setState(() => _projectType = value!),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(labelText: 'Project Description', prefixIcon: Icon(Icons.description), border: OutlineInputBorder()),
                maxLines: 3,
                validator: (value) => value == null || value.trim().isEmpty ? 'Please enter project description' : null,
              ),
              const SizedBox(height: 16),
              ListTile(
                title: const Text('Start Date'),
                subtitle: Text(_formatDate(_startDate)),
                trailing: const Icon(Icons.calendar_today),
                onTap: _selectDate,
                tileColor: Colors.grey[100],
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              const SizedBox(height: 16),
              TextFormField(
                initialValue: _durationDays.toString(),
                decoration: const InputDecoration(labelText: 'Duration (Days)', prefixIcon: Icon(Icons.timelapse), border: OutlineInputBorder()),
                keyboardType: TextInputType.number,
                onChanged: (value) => _durationDays = int.tryParse(value) ?? 30,
                validator: (value) {
                  final days = int.tryParse(value ?? '');
                  if (days == null || days < 1) return 'Please enter valid duration';
                  return null;
                },
              ),
              const SizedBox(height: 24),
              const Text('Contractor Information', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              TextFormField(
                controller: _contractorController,
                decoration: const InputDecoration(labelText: 'Contractor Name (Optional)', prefixIcon: Icon(Icons.business), border: OutlineInputBorder()),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _workersController,
                decoration: const InputDecoration(labelText: 'Number of Workers', prefixIcon: Icon(Icons.groups), border: OutlineInputBorder()),
                keyboardType: TextInputType.number,
                validator: (value) {
                  final workers = int.tryParse(value ?? '');
                  if (workers == null || workers < 1) return 'Please enter valid number';
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _materialsController,
                decoration: const InputDecoration(labelText: 'Materials Description (Optional)', prefixIcon: Icon(Icons.inventory), border: OutlineInputBorder()),
                maxLines: 2,
              ),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: _isSubmitting ? null : _pickDocument,
                icon: const Icon(Icons.attach_file),
                label: Text(_documentName ?? 'Attach Contractor License (Optional)'),
                style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
              ),
              if (_documentName != null) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.check_circle, color: Colors.green, size: 20),
                    const SizedBox(width: 8),
                    Expanded(child: Text(_documentName!, style: const TextStyle(fontSize: 12))),
                    IconButton(
                      icon: const Icon(Icons.close, size: 20),
                      onPressed: () => setState(() {
                        _documentPath = null;
                        _documentName = null;
                      }),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue[200]!),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.info_outline, color: Colors.blue[700]),
                        const SizedBox(width: 8),
                        Text('Note', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blue[900])),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Road fees will be assessed by admin upon approval. You will be notified of the amount and payment instructions.',
                      style: TextStyle(fontSize: 13, color: Colors.blue[900]),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _isSubmitting ? null : _submitRequest,
                style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                child: _isSubmitting
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.white)))
                    : const Text('Submit Request', style: TextStyle(fontSize: 16)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _capitalizeFirst(String text) {
    if (text.isEmpty) return text;
    return text[0].toUpperCase() + text.substring(1);
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
}
