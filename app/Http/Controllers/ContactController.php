<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use App\Services\ContactLimitService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ContactController extends Controller
{
    protected ContactLimitService $contactLimitService;

    public function __construct(ContactLimitService $contactLimitService)
    {
        $this->contactLimitService = $contactLimitService;
    }

    /**
     * Display paginated contacts with search and filters
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            $perPage = $request->get('per_page', 24);
            $search = $request->get('search');
            $status = $request->get('status');
            $classification = $request->get('classification');
            $company = $request->get('company');
            $sortBy = $request->get('sort_by', 'name');
            $sortOrder = $request->get('sort_order', 'asc');

            $query = Contact::where('user_id', $user->id)
                ->select(['id', 'name', 'email', 'company', 'job_title', 'classification', 'status', 'tags', 'last_contacted', 'created_at', 'updated_at']);

            // Apply search filter
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('company', 'like', "%{$search}%")
                        ->orWhere('job_title', 'like', "%{$search}%");
                });
            }

            // Apply filters
            if ($status && $status !== 'all') {
                $query->where('status', $status);
            }
            if ($classification && $classification !== 'all') {
                $query->where('classification', $classification);
            }
            if ($company && $company !== 'all') {
                $query->where('company', 'like', "%{$company}%");
            }

            // Apply sorting
            $query->orderBy($sortBy, $sortOrder);

            // Get paginated results
            $contacts = $query->paginate($perPage)->withQueryString();

            // Transform contacts to match React component format
            $transformedContacts = $contacts->getCollection()->map(function ($contact) {
                return [
                    'id' => $contact->id,
                    'name' => $contact->name ?? 'No Name',
                    'email' => $contact->email,
                    'company' => $contact->company ?? '',
                    'jobTitle' => $contact->job_title ?? '',
                    'classification' => $contact->classification ?? 'prospect',
                    'status' => $contact->status ?? 'active',
                    'tags' => $contact->tags ? json_decode($contact->tags, true) : [],
                    'lastContacted' => $contact->last_contacted ? $contact->last_contacted : null,
                    'created_at' => $contact->created_at->toISOString(),
                    'updated_at' => $contact->updated_at->toISOString(),
                ];
            });

            // Get usage stats using the service
            $usageStats = $this->contactLimitService->getUsageStats($user);

            // Get classification stats
            $classificationStats = Contact::where('user_id', $user->id)
                ->select('classification', DB::raw('count(*) as count'))
                ->groupBy('classification')
                ->pluck('count', 'classification')
                ->toArray();

            // Get unique companies for filter dropdown
            $companies = Contact::where('user_id', $user->id)
                ->whereNotNull('company')
                ->distinct()
                ->pluck('company')
                ->filter()
                ->values();

            return Inertia::render('user/contacts/index', [
                'contacts' => [
                    'data' => $transformedContacts,
                    'current_page' => $contacts->currentPage(),
                    'last_page' => $contacts->lastPage(),
                    'per_page' => $contacts->perPage(),
                    'total' => $contacts->total(),
                    'links' => $contacts->linkCollection(),
                ],
                'filters' => [
                    'search' => $search,
                    'status' => $status,
                    'classification' => $classification,
                    'company' => $company,
                    'sort_by' => $sortBy,
                    'sort_order' => $sortOrder,
                ],
                'usage' => $usageStats,
                'stats' => [
                    'total' => $usageStats['used'],
                    'classifications' => $classificationStats,
                    'active' => Contact::where('user_id', $user->id)->where('status', 'active')->count(),
                    'recent' => Contact::where('user_id', $user->id)->where('created_at', '>=', now()->subDays(7))->count(),
                ],
                'companies' => $companies,
                'upgrade_suggestions' => $this->contactLimitService->getUpgradeSuggestions($user),
            ]);
        } catch (\Exception $e) {
            Log::error('Contact index error: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'request' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            return back()->with('error', 'Failed to load contacts. Please try again.');
        }
    }

    /**
     * Store a new contact
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();

            // Check if user can add more contacts
            if (!$this->contactLimitService->canAddContacts($user)) {
                $usageStats = $this->contactLimitService->getUsageStats($user);
                return back()->with('error', "Contact limit reached. You have used {$usageStats['used']}/{$usageStats['limit']} contacts on your {$usageStats['plan']} plan. Please upgrade to add more contacts.");
            }

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => [
                    'required',
                    'email',
                    'max:255',
                    Rule::unique('contacts')->where(function ($query) {
                        return $query->where('user_id', Auth::id());
                    }),
                ],
                'company' => 'nullable|string|max:255',
                'job_title' => 'nullable|string|max:255',
                'phone' => 'nullable|string|max:20',
                'classification' => 'required|in:lead,prospect,customer,partner,vendor,other',
                'status' => 'required|in:active,inactive,blocked',
                'tags' => 'nullable|array',
                'custom_fields' => 'nullable|array',
            ]);

            $contact = Contact::create([
                'user_id' => Auth::id(),
                'name' => $validated['name'],
                'email' => $validated['email'],
                'company' => $validated['company'] ?? null,
                'job_title' => $validated['job_title'] ?? null,
                'classification' => $validated['classification'],
                'status' => $validated['status'],
                'tags' => $validated['tags'] ? json_encode($validated['tags']) : null,
                'custom_fields' => $validated['custom_fields'] ?? null,
            ]);

            return redirect()->route('contacts.index')->with('success', 'Contact created successfully!');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('Contact store error: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            return back()->with('error', 'Failed to create contact. Please try again.');
        }
    }

    /**
     * Display a specific contact
     */
    public function show(Contact $contact)
    {
        try {
            // Ensure user can only view their own contacts
            if ($contact->user_id !== Auth::id()) {
                abort(403, 'Unauthorized access to contact.');
            }

            return Inertia::render('Contacts/Show', [
                'contact' => [
                    'id' => $contact->id,
                    'name' => $contact->name,
                    'email' => $contact->email,
                    'company' => $contact->company,
                    'jobTitle' => $contact->job_title,
                    'classification' => $contact->classification,
                    'status' => $contact->status,
                    'tags' => $contact->tags ? json_decode($contact->tags, true) : [],
                    'lastContacted' => $contact->last_contacted ? $contact->last_contacted->toISOString() : null,
                    'customFields' => $contact->custom_fields,
                    'created_at' => $contact->created_at->toISOString(),
                    'updated_at' => $contact->updated_at->toISOString(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Contact show error: ' . $e->getMessage(), [
                'contact_id' => $contact->id ?? null,
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString()
            ]);
            return back()->with('error', 'Contact not found.');
        }
    }

    /**
     * Update a contact
     */
    public function update(Request $request, Contact $contact)
    {
        try {
            // Ensure user can only update their own contacts
            if ($contact->user_id !== Auth::id()) {
                abort(403, 'Unauthorized access to contact.');
            }

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => [
                    'required',
                    'email',
                    'max:255',
                    Rule::unique('contacts')->where(function ($query) {
                        return $query->where('user_id', Auth::id());
                    })->ignore($contact->id),
                ],
                'company' => 'nullable|string|max:255',
                'job_title' => 'nullable|string|max:255',
                'classification' => 'required|in:lead,prospect,customer,partner,vendor,other',
                'status' => 'required|in:active,inactive,blocked',
                'tags' => 'nullable|array',
                'custom_fields' => 'nullable|array',
            ]);

            $contact->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'company' => $validated['company'] ?? null,
                'job_title' => $validated['job_title'] ?? null,
                'classification' => $validated['classification'],
                'status' => $validated['status'],
                'tags' => $validated['tags'] ? json_encode($validated['tags']) : null,
                'custom_fields' => $validated['custom_fields'] ?? null,
            ]);

            return redirect()->route('contacts.index')->with('success', 'Contact updated successfully!');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('Contact update error: ' . $e->getMessage(), [
                'contact_id' => $contact->id,
                'user_id' => Auth::id(),
                'data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            return back()->with('error', 'Failed to update contact. Please try again.');
        }
    }

    /**
     * Delete a contact
     */
    public function destroy(Contact $contact)
    {
        try {
            // Ensure user can only delete their own contacts
            if ($contact->user_id !== Auth::id()) {
                abort(403, 'Unauthorized access to contact.');
            }

            $contactName = $contact->name;
            $contact->delete();

            return redirect()->route('contacts.index')->with('success', "Contact '{$contactName}' deleted successfully!");
        } catch (\Exception $e) {
            Log::error('Contact destroy error: ' . $e->getMessage(), [
                'contact_id' => $contact->id,
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString()
            ]);
            return back()->with('error', 'Failed to delete contact. Please try again.');
        }
    }

    /**
     * Bulk delete contacts
     */
    public function bulkDelete(Request $request)
    {
        try {
            $validated = $request->validate([
                'contact_ids' => 'required|array|min:1',
                'contact_ids.*' => 'integer|exists:contacts,id',
            ]);

            $contactIds = $validated['contact_ids'];

            // Ensure user can only delete their own contacts
            $userContactIds = Contact::where('user_id', Auth::id())
                ->whereIn('id', $contactIds)
                ->pluck('id')
                ->toArray();

            if (count($userContactIds) !== count($contactIds)) {
                return back()->with('error', 'Some contacts could not be deleted. Access denied.');
            }

            $deletedCount = Contact::whereIn('id', $userContactIds)->delete();

            return redirect()->route('contacts.index')->with('success', "{$deletedCount} contacts deleted successfully!");
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors());
        } catch (\Exception $e) {
            Log::error('Bulk delete error: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'contact_ids' => $request->get('contact_ids', []),
                'trace' => $e->getTraceAsString()
            ]);
            return back()->with('error', 'Failed to delete contacts. Please try again.');
        }
    }

    /**
     * Bulk update contacts
     */
    public function bulkUpdate(Request $request)
    {
        try {
            $validated = $request->validate([
                'contact_ids' => 'required|array|min:1',
                'contact_ids.*' => 'integer|exists:contacts,id',
                'updates' => 'required|array',
                'updates.status' => 'nullable|in:active,inactive,blocked',
                'updates.company' => 'nullable|string|max:255',
                'updates.job_title' => 'nullable|string|max:255',
                'updates.classification' => 'nullable|in:lead,prospect,customer,partner,vendor,other',
                'updates.tags' => 'nullable|array',
            ]);

            $contactIds = $validated['contact_ids'];
            $updates = array_filter($validated['updates']); // Remove null values

            // Ensure user can only update their own contacts
            $userContactIds = Contact::where('user_id', Auth::id())
                ->whereIn('id', $contactIds)
                ->pluck('id')
                ->toArray();

            if (count($userContactIds) !== count($contactIds)) {
                return back()->with('error', 'Some contacts could not be updated. Access denied.');
            }

            if (empty($updates)) {
                return back()->with('error', 'No valid updates provided.');
            }

            // Handle tags update
            if (isset($updates['tags'])) {
                $updates['tags'] = json_encode($updates['tags']);
            }

            $updatedCount = Contact::whereIn('id', $userContactIds)->update($updates);

            return redirect()->route('contacts.index')->with('success', "{$updatedCount} contacts updated successfully!");
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors());
        } catch (\Exception $e) {
            Log::error('Bulk update error: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'contact_ids' => $request->get('contact_ids', []),
                'updates' => $request->get('updates', []),
                'trace' => $e->getTraceAsString()
            ]);
            return back()->with('error', 'Failed to update contacts. Please try again.');
        }
    }

    /**
     * Import contacts from CSV
     */
    public function import(Request $request)
    {
        try {
            $user = Auth::user();

            $validated = $request->validate([
                'file' => 'required|file|mimes:csv,txt|max:10240', // 10MB max
            ]);

            $file = $validated['file'];
            $csvData = array_map('str_getcsv', file($file->path()));
            $header = array_shift($csvData); // Remove header row

            // Validate import size against user's limit
            $importValidation = $this->contactLimitService->validateImportSize($user, count($csvData));
            
            if (!$importValidation['valid']) {
                return back()->with('error', $importValidation['message']);
            }

            // Map CSV headers to database fields
            $fieldMapping = [
                'name' => ['name', 'full_name', 'contact_name'],
                'email' => ['email', 'email_address'],
                'company' => ['company', 'organization', 'company_name'],
                'job_title' => ['job_title', 'title', 'position', 'role'],
                'classification' => ['classification', 'type'],
                'status' => ['status'],
                'tags' => ['tags'],
            ];

            $headerMap = [];
            foreach ($header as $index => $columnName) {
                $columnName = strtolower(trim($columnName));
                foreach ($fieldMapping as $dbField => $possibleNames) {
                    if (in_array($columnName, $possibleNames)) {
                        $headerMap[$index] = $dbField;
                        break;
                    }
                }
                // Store unmapped columns as custom fields
                if (!isset($headerMap[$index])) {
                    $headerMap[$index] = 'custom_' . $columnName;
                }
            }

            $importedCount = 0;
            $errors = [];

            DB::beginTransaction();

            foreach ($csvData as $rowIndex => $row) {
                try {
                    // Check if we've reached the user's limit during import
                    if (!$this->contactLimitService->canAddContacts($user)) {
                        $usageStats = $this->contactLimitService->getUsageStats($user);
                        $errors[] = "Import stopped: Contact limit reached ({$usageStats['used']}/{$usageStats['limit']})";
                        break;
                    }

                    $contactData = ['user_id' => Auth::id()];
                    $customFields = [];

                    foreach ($row as $colIndex => $value) {
                        $value = trim($value);
                        if (empty($value)) continue;

                        $fieldName = $headerMap[$colIndex] ?? null;
                        if (!$fieldName) continue;

                        if (str_starts_with($fieldName, 'custom_')) {
                            $customFields[substr($fieldName, 7)] = $value;
                        } else {
                            $contactData[$fieldName] = $value;
                        }
                    }

                    // Skip rows without required fields
                    if (empty($contactData['email'])) {
                        $errors[] = "Row " . ($rowIndex + 2) . ": Email is required";
                        continue;
                    }

                    // Check for duplicate email for this user
                    $existingContact = Contact::where('user_id', Auth::id())
                        ->where('email', $contactData['email'])
                        ->first();

                    if ($existingContact) {
                        $errors[] = "Row " . ($rowIndex + 2) . ": Email {$contactData['email']} already exists";
                        continue;
                    }

                    if (!empty($customFields)) {
                        $contactData['custom_fields'] = $customFields;
                    }

                    // Handle tags import
                    if (isset($contactData['tags'])) {
                        $contactData['tags'] = json_encode(explode(',', $contactData['tags']));
                    }

                    Contact::create($contactData);
                    $importedCount++;
                } catch (\Exception $e) {
                    $errors[] = "Row " . ($rowIndex + 2) . ": " . $e->getMessage();
                }
            }

            DB::commit();

            $message = "{$importedCount} contacts imported successfully!";
            if (!empty($errors)) {
                $message .= " " . count($errors) . " rows had errors.";
            }

            return redirect()->route('contacts.index')
                ->with('success', $message)
                ->with('import_errors', $errors);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return back()->withErrors($e->errors());
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Import error: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'file_name' => $request->file('file')?->getClientOriginalName(),
                'trace' => $e->getTraceAsString()
            ]);
            return back()->with('error', 'Failed to import contacts. Please try again.');
        }
    }

    /**
     * Export contacts to CSV
     */
    public function export(Request $request)
    {
        try {
            $user = Auth::user();
            $search = $request->get('search');

            // Build query with same filters as index
            $query = Contact::where('user_id', $user->id)
                ->select(['name', 'email', 'company', 'job_title', 'classification', 'status', 'tags', 'custom_fields', 'created_at']);

            // Apply search filter
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('company', 'like', "%{$search}%")
                        ->orWhere('job_title', 'like', "%{$search}%");
                });
            }

            $contacts = $query->orderBy('name')->get();

            $filename = 'contacts_' . date('Y-m-d_H-i-s') . '.csv';

            // Set headers for file download
            $headers = [
                'Content-Type' => 'text/csv; charset=utf-8',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
                'Cache-Control' => 'no-cache, no-store, must-revalidate',
                'Pragma' => 'no-cache',
                'Expires' => '0',
            ];

            // Create CSV content
            $callback = function () use ($contacts) {
                $file = fopen('php://output', 'w');
                // Add BOM for UTF-8 (helps with Excel compatibility)
                fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));

                // Write CSV header
                fputcsv($file, [
                    'Name',
                    'Email',
                    'Company',
                    'Job Title',
                    'Classification',
                    'Status',
                    'Tags',
                    'Custom Fields',
                    'Created Date'
                ]);

                // Write contact data
                foreach ($contacts as $contact) {
                    $customFields = '';
                    if ($contact->custom_fields && is_array($contact->custom_fields)) {
                        $customFields = json_encode($contact->custom_fields);
                    }

                    $tags = '';
                    if ($contact->tags) {
                        if (is_array($contact->tags)) {
                            $tags = implode(',', $contact->tags);
                        } else {
                            $tags = implode(',', json_decode($contact->tags, true) ?? []);
                        }
                    }

                    fputcsv($file, [
                        $contact->name ?? '',
                        $contact->email ?? '',
                        $contact->company ?? '',
                        $contact->job_title ?? '',
                        $contact->classification ?? '',
                        $contact->status ?? '',
                        $tags,
                        $customFields,
                        $contact->created_at ? $contact->created_at->format('Y-m-d H:i:s') : '',
                    ]);
                }

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);
        } catch (\Exception $e) {
            Log::error('Export failed: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'filters' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            return back()->with('error', 'Failed to export contacts. Please try again.');
        }
    }

    /**
     * Download CSV template for import
     */
    public function downloadTemplate()
    {
        try {
            $filename = 'contacts_import_template.csv';
            $headers = [
                'Content-Type' => 'text/csv; charset=utf-8',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
                'Cache-Control' => 'no-cache, no-store, must-revalidate',
                'Pragma' => 'no-cache',
                'Expires' => '0',
            ];

            $callback = function () {
                $file = fopen('php://output', 'w');
                // Add BOM for UTF-8
                fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));

                // Write header row
                fputcsv($file, [
                    'name',
                    'email',
                    'company',
                    'job_title',
                    'classification',
                    'status',
                    'tags',
                    'phone',
                    'department',
                    'notes'
                ]);

                // Write sample data
                fputcsv($file, [
                    'John Doe',
                    'john@example.com',
                    'Example Corp',
                    'Marketing Manager',
                    'prospect',
                    'active',
                    'tag1,tag2',
                    '+1 (555) 123-4567',
                    'Marketing',
                    'Sample contact'
                ]);

                fputcsv($file, [
                    'Jane Smith',
                    'jane@company.com',
                    'Tech Solutions',
                    'CEO',
                    'customer',
                    'inactive',
                    'tag3',
                    '+1 (555) 987-6543',
                    'Executive',
                    'Another sample'
                ]);

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);
        } catch (\Exception $e) {
            Log::error('Template download failed: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString()
            ]);
            return back()->with('error', 'Failed to download template. Please try again.');
        }
    }
}
