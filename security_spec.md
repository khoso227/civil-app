# Security Specification - Civil-OS

## Data Invariants
1. **User Profiles**: A user can only read and write their own profile data. Roles cannot be self-assigned; they must be managed by an admin (or during a restricted onboarding flow if applicable, but here we'll restrict it to prevent escalation).
2. **Projects**: Only the owner of a project can create, update, or delete it. All signed-in users can read (list/get) projects (as it seems to be a collaborative app), but writes are restricted.
3. **Project Resources (Tasks, Inventory, Photos)**: These are children of a Project. Access is derived from being a signed-in user or the project owner. In this app, it seems all staff can see project details, but only the owner/admin should modify.
4. **Team Messages**: Any signed-in user can read all messages and create their own. Messages are immutable after creation.
5. **Equipment**: Centralized hub. Any signed-in user can read and update status (for check-ins/ops).

## The "Dirty Dozen" Payloads

1. **Identity Spoofing (User Profile)**: `POST /users/attacker_id { "roles": ["Admin"], "email": "attacker@gmail.com" }` -> Denied (Admin role injected).
2. **Identity Spoofing (Project)**: `POST /projects { "name": "Hack", "ownerId": "victim_id" }` -> Denied (ownerId mismatch).
3. **Privilege Escalation**: `UPDATE /users/my_id { "roles": ["Admin"] }` -> Denied (roles field modified by user).
4. **PII Leak**: `GET /users/victim_id` -> Denied (requesting someone else's profile).
5. **Orphaned Task**: `POST /projects/non_existent/tasks { ... }` -> Denied (parent project must exist).
6. **State Shortcutting**: `UPDATE /projects/p1 { "status": "Completed" }` -> Denied (if not the owner).
7. **Resource Poisoning**: `POST /team_messages { "text": "A" * 10000 }` -> Denied (size limit exceeded).
8. **Shadow Update**: `UPDATE /projects/p1 { "isVerified": true }` -> Denied (Ghost field injection).
9. **Update Gap**: `UPDATE /team_messages/m1 { "text": "Changed" }` -> Denied (Messages are immutable).
10. **ID Poisoning**: `GET /projects/very_long_string_with_illegal_characters_!!!` -> Denied (isValidId fail).
11. **Timestamp Spoofing**: `POST /team_messages { "createdAt": "2020-01-01" }` -> Denied (must be server timestamp).
12. **Malicious Query**: `GET /team_messages` -> Denied if query doesn't match list rule (though here messages are public, we'll enforce list safety).

## Test Runner (Mock Tests)
See `firestore.rules.test.ts` for implementation.
