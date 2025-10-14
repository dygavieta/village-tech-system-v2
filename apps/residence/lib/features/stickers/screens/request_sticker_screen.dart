import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import '../models/vehicle_sticker.dart';
import '../providers/sticker_provider.dart';
import '../../household/providers/member_provider.dart';

class RequestStickerScreen extends ConsumerStatefulWidget {
  const RequestStickerScreen({super.key});

  @override
  ConsumerState<RequestStickerScreen> createState() => _RequestStickerScreenState();
}

class _RequestStickerScreenState extends ConsumerState<RequestStickerScreen> {
  final _formKey = GlobalKey<FormState>();
  final _plateController = TextEditingController();
  final _makeController = TextEditingController();
  final _colorController = TextEditingController();

  String _stickerType = 'resident_permanent';
  String? _documentPath;
  String? _documentName;
  bool _isUploading = false;

  @override
  void dispose() {
    _plateController.dispose();
    _makeController.dispose();
    _colorController.dispose();
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

  Future<void> _submitRequest() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_documentPath == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please attach OR/CR document'), backgroundColor: Colors.orange),
      );
      return;
    }

    setState(() => _isUploading = true);

    try {
      // Upload document
      final documentUrl = await ref
          .read(stickerNotifierProvider.notifier)
          .uploadDocument(_documentPath!, _documentName!);

      final householdId = await ref.read(currentHouseholdIdProvider.future);

      final sticker = VehicleSticker(
        id: '',
        householdId: householdId,
        vehiclePlate: _plateController.text.trim().toUpperCase(),
        vehicleMake: _makeController.text.trim(),
        vehicleColor: _colorController.text.trim(),
        stickerType: _stickerType,
        status: StickerStatus.pending,
        orCrDocumentUrl: documentUrl,
        createdAt: DateTime.now(),
      );

      await ref.read(stickerNotifierProvider.notifier).requestSticker(sticker);

      if (!mounted) return;

      final state = ref.read(stickerNotifierProvider);

      state.when(
        data: (_) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Sticker request submitted successfully'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.pop(context, true);
        },
        loading: () {},
        error: (error, _) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $error'), backgroundColor: Colors.red),
          );
          setState(() => _isUploading = false);
        },
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
      setState(() => _isUploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Request Vehicle Sticker'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Vehicle Information', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              TextFormField(
                controller: _plateController,
                decoration: const InputDecoration(
                  labelText: 'Plate Number',
                  hintText: 'ABC-1234',
                  prefixIcon: Icon(Icons.pin),
                  border: OutlineInputBorder(),
                ),
                textCapitalization: TextCapitalization.characters,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter plate number';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _makeController,
                decoration: const InputDecoration(
                  labelText: 'Make & Model',
                  hintText: 'Toyota Vios',
                  prefixIcon: Icon(Icons.directions_car),
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter vehicle make and model';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _colorController,
                decoration: const InputDecoration(
                  labelText: 'Color',
                  hintText: 'White',
                  prefixIcon: Icon(Icons.palette),
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter vehicle color';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _stickerType,
                decoration: const InputDecoration(
                  labelText: 'Sticker Type',
                  prefixIcon: Icon(Icons.category),
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(value: 'resident_permanent', child: Text('Resident Permanent')),
                  DropdownMenuItem(value: 'temporary_guest', child: Text('Temporary Guest')),
                ],
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _stickerType = value);
                  }
                },
              ),
              const SizedBox(height: 24),
              const Text('Required Documents', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: _isUploading ? null : _pickDocument,
                icon: const Icon(Icons.attach_file),
                label: Text(_documentName ?? 'Attach OR/CR Document'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
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
              ElevatedButton(
                onPressed: _isUploading ? null : _submitRequest,
                style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                child: _isUploading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text('Submit Request', style: TextStyle(fontSize: 16)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
