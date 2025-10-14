# Phase 8 Developer Guide: Optimistic Updates & Form Validation

Quick reference for implementing optimistic updates and form validation in the village-tech-system.

---

## Optimistic Updates

### Admin App (React + TanStack Query)

#### Step 1: Create Mutation Hook

**File:** `/apps/admin/src/lib/hooks/use-your-mutation.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { yourServerAction } from '@/lib/actions/your-action';

export function useYourMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: yourServerAction,

    // Optimistic update
    onMutate: async (variables) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['your-data'] });

      // Snapshot previous state
      const previousData = queryClient.getQueryData(['your-data']);

      // Optimistically update
      queryClient.setQueryData(['your-data'], (old) => {
        // Your update logic
        return updatedData;
      });

      // Return context for rollback
      return { previousData };
    },

    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['your-data'], context.previousData);
      }
    },

    // Refetch after success/error
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['your-data'] });
    },
  });
}
```

#### Step 2: Use in Component

```typescript
'use client';

import { useYourMutation } from '@/lib/hooks/use-your-mutation';
import { useToast } from '@/components/ui/use-toast';

export function YourComponent() {
  const { toast } = useToast();
  const mutation = useYourMutation();

  const handleAction = async (data) => {
    mutation.mutate(data, {
      onSuccess: () => {
        toast({ title: 'Success!' });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
      },
    });
  };

  return (
    <button
      onClick={() => handleAction(data)}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? 'Loading...' : 'Submit'}
    </button>
  );
}
```

### Residence/Sentinel Apps (Flutter + Riverpod)

#### Step 1: Create Notifier

**File:** `/apps/residence/lib/features/your-feature/providers/your_provider.dart`

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class YourNotifier extends AutoDisposeAsyncNotifier<List<YourModel>> {
  @override
  Future<List<YourModel>> build() async {
    // Fetch initial data
    final supabase = Supabase.instance.client;
    final response = await supabase.from('your_table').select();
    return response.map((json) => YourModel.fromJson(json)).toList();
  }

  Future<void> updateItem(String id, Map<String, dynamic> data) async {
    // 1. Snapshot previous state
    final previousState = state.valueOrNull ?? [];

    // 2. Optimistically update
    state = AsyncValue.data(
      previousState.map((item) =>
        item.id == id ? item.copyWith(data) : item
      ).toList(),
    );

    try {
      // 3. Perform server update
      await Supabase.instance.client
          .from('your_table')
          .update(data)
          .eq('id', id);
    } catch (e, stack) {
      // 4. Rollback on error
      state = AsyncValue.data(previousState);
      state = AsyncError(e, stack);
      rethrow;
    }
  }
}

final yourNotifierProvider =
    AutoDisposeAsyncNotifierProvider<YourNotifier, List<YourModel>>(
  YourNotifier.new,
);
```

#### Step 2: Use in Widget

```dart
class YourWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dataAsync = ref.watch(yourNotifierProvider);
    final notifier = ref.read(yourNotifierProvider.notifier);

    return dataAsync.when(
      data: (items) => ListView.builder(
        itemCount: items.length,
        itemBuilder: (context, index) {
          final item = items[index];
          return ListTile(
            title: Text(item.name),
            trailing: IconButton(
              icon: Icon(Icons.check),
              onPressed: () async {
                try {
                  await notifier.updateItem(item.id, {'status': 'completed'});
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Updated successfully')),
                  );
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Error: $e')),
                  );
                }
              },
            ),
          );
        },
      ),
      loading: () => CircularProgressIndicator(),
      error: (error, stack) => Text('Error: $error'),
    );
  }
}
```

---

## Form Validation

### Admin App (React Hook Form + Zod)

#### Step 1: Define Schema

**File:** `/apps/admin/src/lib/validations/schemas.ts`

```typescript
import { z } from 'zod';

export const yourFormSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters'),

  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address'),

  age: z
    .number({ required_error: 'Age is required' })
    .int('Age must be a whole number')
    .min(18, 'Must be at least 18 years old')
    .max(120, 'Invalid age'),

  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
});

export type YourFormInput = z.infer<typeof yourFormSchema>;
```

#### Step 2: Use in Form Component

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { yourFormSchema, type YourFormInput } from '@/lib/validations/schemas';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function YourForm() {
  const form = useForm<YourFormInput>({
    resolver: zodResolver(yourFormSchema),
    defaultValues: {
      name: '',
      email: '',
      age: 18,
      phone: '',
    },
  });

  const handleSubmit = async (data: YourFormInput) => {
    try {
      // Submit data
      console.log(data);
    } catch (error) {
      // Handle error
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </form>
    </Form>
  );
}
```

### Residence/Sentinel Apps (Flutter Validators)

#### Step 1: Import Validators

```dart
import 'package:your_app/core/utils/validators.dart';
```

#### Step 2: Use in Form

```dart
class YourFormWidget extends StatefulWidget {
  @override
  _YourFormWidgetState createState() => _YourFormWidgetState();
}

class _YourFormWidgetState extends State<YourFormWidget> {
  final _formKey = GlobalKey<FormState>();
  String? _name;
  String? _email;
  String? _phone;

  void _handleSubmit() {
    if (_formKey.currentState!.validate()) {
      _formKey.currentState!.save();

      // Submit data
      print('Name: $_name, Email: $_email, Phone: $_phone');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          // Name field
          TextFormField(
            decoration: InputDecoration(
              labelText: 'Name *',
              hintText: 'Enter your name',
            ),
            validator: (value) => validateName(value, fieldName: 'Name'),
            onSaved: (value) => _name = value,
          ),
          SizedBox(height: 16),

          // Email field
          TextFormField(
            decoration: InputDecoration(
              labelText: 'Email *',
              hintText: 'Enter your email',
            ),
            keyboardType: TextInputType.emailAddress,
            validator: validateEmail,
            onSaved: (value) => _email = value,
          ),
          SizedBox(height: 16),

          // Phone field
          TextFormField(
            decoration: InputDecoration(
              labelText: 'Phone Number',
              hintText: '+63 XXX XXX XXXX',
            ),
            keyboardType: TextInputType.phone,
            validator: validatePhoneNumber,
            onSaved: (value) => _phone = value,
          ),
          SizedBox(height: 24),

          // Submit button
          ElevatedButton(
            onPressed: _handleSubmit,
            child: Text('Submit'),
          ),
        ],
      ),
    );
  }
}
```

#### Step 3: Combine Validators

```dart
TextFormField(
  decoration: InputDecoration(labelText: 'Plate Number *'),
  validator: combineValidators([
    (v) => validateRequired(v, fieldName: 'Plate Number'),
    validatePlateNumber,
  ]),
  onSaved: (value) => _plateNumber = value,
)
```

---

## Common Patterns

### Residence App: Sticker Request Form

```dart
import 'package:your_app/core/utils/validators.dart';

// Plate number with validation
TextFormField(
  decoration: InputDecoration(labelText: 'Plate Number *'),
  validator: validatePlateNumber,
  onSaved: (value) => _plateNumber = value,
)

// Vehicle make
TextFormField(
  decoration: InputDecoration(labelText: 'Vehicle Make *'),
  validator: validateVehicleMake,
  onSaved: (value) => _vehicleMake = value,
)

// Vehicle color
TextFormField(
  decoration: InputDecoration(labelText: 'Vehicle Color *'),
  validator: validateColor,
  onSaved: (value) => _vehicleColor = value,
)
```

### Residence App: Permit Request Form

```dart
// Project description
TextFormField(
  decoration: InputDecoration(labelText: 'Project Description *'),
  maxLines: 4,
  validator: validateProjectDescription,
  onSaved: (value) => _description = value,
)

// Start date (no past dates)
TextFormField(
  decoration: InputDecoration(labelText: 'Start Date *'),
  validator: (v) => validateDate(v, allowPast: false),
  onTap: () => _selectDate(context),
)

// Duration in days
TextFormField(
  decoration: InputDecoration(labelText: 'Duration (days) *'),
  keyboardType: TextInputType.number,
  validator: (v) => validateDuration(int.tryParse(v ?? '')),
  onSaved: (value) => _duration = int.parse(value!),
)

// Number of workers
TextFormField(
  decoration: InputDecoration(labelText: 'Number of Workers *'),
  keyboardType: TextInputType.number,
  validator: (v) => validateWorkerCount(int.tryParse(v ?? '')),
  onSaved: (value) => _workerCount = int.parse(value!),
)
```

### Sentinel App: Incident Report Form

```dart
import 'package:sentinel/core/utils/validators.dart';

// Incident description
TextFormField(
  decoration: InputDecoration(labelText: 'Incident Description *'),
  maxLines: 4,
  validator: validateIncidentDescription,
  onSaved: (value) => _description = value,
)

// Location
TextFormField(
  decoration: InputDecoration(labelText: 'Location *'),
  validator: validateLocation,
  onSaved: (value) => _location = value,
)

// Severity dropdown
DropdownButtonFormField<String>(
  decoration: InputDecoration(labelText: 'Severity *'),
  items: ['Low', 'Medium', 'High', 'Critical']
      .map((s) => DropdownMenuItem(
            value: s.toLowerCase(),
            child: Text(s),
          ))
      .toList(),
  validator: validateSeverity,
  onSaved: (value) => _severity = value,
)

// Person name (optional)
TextFormField(
  decoration: InputDecoration(labelText: 'Person Involved'),
  validator: validatePersonName,
  onSaved: (value) => _personName = value,
)

// Plate number (optional)
TextFormField(
  decoration: InputDecoration(labelText: 'Vehicle Plate'),
  validator: validatePlateNumber,
  onSaved: (value) => _plateNumber = value,
)
```

---

## Best Practices

### Optimistic Updates

✅ **DO:**
- Always snapshot previous state before optimistic update
- Rollback on error
- Invalidate queries after success
- Use TypeScript/Dart type safety
- Show loading indicators during mutations
- Display clear error messages

❌ **DON'T:**
- Skip rollback logic
- Forget to invalidate cache
- Ignore error states
- Update state without snapshotting

### Form Validation

✅ **DO:**
- Validate on field change (real-time)
- Show errors below fields
- Disable submit when invalid
- Clear errors on field edit
- Use consistent error messages
- Combine validators for complex rules

❌ **DON'T:**
- Validate only on submit
- Show generic error messages
- Allow submission of invalid data
- Forget to handle server errors
- Duplicate validation logic

---

## Troubleshooting

### Optimistic Update Not Showing
1. Check query key matches in `cancelQueries` and `setQueryData`
2. Verify `onMutate` is returning context
3. Check if component is using correct query key

### Rollback Not Working
1. Ensure `onError` receives context from `onMutate`
2. Verify context contains previous state
3. Check if `setQueryData` is called in `onError`

### Validation Not Triggering
1. Verify form is using `resolver: zodResolver(schema)`
2. Check field names match schema keys
3. Ensure `FormMessage` component is rendered

### Flutter Validator Not Working
1. Check if form has `GlobalKey<FormState>`
2. Verify `validator` prop is set on `TextFormField`
3. Call `_formKey.currentState!.validate()` before submit

---

## Testing

### Test Optimistic Updates

```typescript
// Admin app test example
test('should optimistically update and rollback on error', async () => {
  const queryClient = new QueryClient();
  const { result } = renderHook(() => useYourMutation(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    ),
  });

  // Mock server action to fail
  mockServerAction.mockRejectedValue(new Error('Server error'));

  // Perform mutation
  await result.current.mutate({ id: '123', data: {} });

  // Verify rollback happened
  expect(queryClient.getQueryData(['your-data'])).toEqual(previousData);
});
```

### Test Form Validation

```typescript
// Admin app validation test
test('should show error for invalid email', () => {
  const { getByLabelText, getByText } = render(<YourForm />);

  const emailInput = getByLabelText('Email *');
  fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
  fireEvent.blur(emailInput);

  expect(getByText('Invalid email address')).toBeInTheDocument();
});
```

---

## Additional Resources

- [TanStack Query Docs](https://tanstack.com/query/latest/docs/react/overview)
- [React Hook Form Docs](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [Riverpod Documentation](https://riverpod.dev/)
- [Flutter Form Validation](https://docs.flutter.dev/cookbook/forms/validation)

---

**Questions or Issues?**
Refer to the main implementation summary: `PHASE_8_IMPLEMENTATION_SUMMARY.md`
