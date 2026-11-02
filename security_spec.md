# Security Specification - ISSEG Connect

## 1. Data Invariants

1. **User Identity Invariant**: A user document at `/users/{userId}` can only be created or modified by the authenticated user whose `request.auth.uid == userId`.
2. **Post Authorship Invariant**: A post's `authorId` must strictly equal `request.auth.uid`. A post can only be edited or deleted by its creator.
3. **Likes Invariant**: A user may only add or remove their own `uid` from the `likes` array.
4. **Comment Invariant**: A comment's `authorId` must match `request.auth.uid`.
5. **Group Membership Invariant**: Creating a group requires the creator to be the authenticated user and a member of that group. Group updates are restricted to member joining/leaving or creator editing.
6. **Group Message Invariant**: A group message can only be posted by a member of the group, and `authorId` must match `request.auth.uid`.
7. **Direct Messaging Privacy**: Conversations and Direct Messages are only readable and writeable by participants (`request.auth.uid in resource.data.participants`).
8. **Document Attribution**: An academic document's `authorId` must match `request.auth.uid`.
9. **Notification Privacy**: Notifications are strictly private to the recipient (`resource.data.userId == request.auth.uid`).

---

## 2. The "Dirty Dozen" Payloads (Attacks designed to be rejected)

1. **Payload 1 (Impersonation Write)**: An authenticated user `userA` attempts to create or overwrite `/users/userB`.
2. **Payload 2 (Spoofed Post Author)**: User `userA` attempts to create a post with `"authorId": "userB"`.
3. **Payload 3 (Unauthenticated Read of Private Conversations)**: An unauthenticated request attempts to list `/conversations`.
4. **Payload 4 (Eavesdropping on Private Chat)**: User `userC` attempts to read `/conversations/conv123` where `conv123.participants = ["userA", "userB"]`.
5. **Payload 5 (Junk ID Injection)**: Attempt to create `/users/$$$###junk_invalid_id$$$` with characters violating ID constraints.
6. **Payload 6 (Oversized Content Attack)**: Attempt to post content of size 10MB into a post's `content` field.
7. **Payload 7 (Post Deletion by Stranger)**: User `userB` attempts to delete a post created by `userA`.
8. **Payload 8 (Foreign Group Message)**: User `userX` who is not a member of `group1` attempts to write to `/groups/group1/messages/msg1`.
9. **Payload 9 (Forged Notification)**: User `userA` attempts to mark a notification belonging to `userB` as read.
10. **Payload 10 (Document Spoofing)**: User `userA` uploads a course document with `authorId: "professor_smith"`.
11. **Payload 11 (Shadow Field Injection)**: Attempt to update user profile with admin privileges (`{ "role": "admin" }` or `{ "isAdmin": true }`).
12. **Payload 12 (Foreign Comment Tampering)**: User `userB` attempts to delete or modify a comment created by `userA`.
