Product & Technical Document: Freespeak "Publish to Web" Feature
1. Feature Overview & Vision
Feature: Publish to Web (Client-Side Sharing)

Vision: To empower users to instantly create a permanent, read-only web link for any of their Freespeak entries. This feature transforms a private note into a shareable article, draft, or snippet without ever sending the data to a server until the moment of sharing. It prioritizes speed, privacy, and simplicity by leveraging the browser itself as the publishing engine.

2. User Experience (UX) & Flow
The user flow is designed to be instantaneous and intuitive:

Initiate Share: While viewing an entry in the sidebar, the user will see a new "Share" or "Publish" icon next to the entry name.

Generate Link: Clicking this icon will instantly open a small modal. This modal will display a unique, shareable URL (e.g., https://freespeak.vercel.app/#/s/AbCdEfGh...).

Copy & Share: The modal will have a "Copy Link" button. The user can then paste this link anywhere—in an email, a chat message, or on social media.

Viewing: Anyone who opens the link will be taken to a clean, read-only view of the content, rendered with the same font and theme settings as the main app. They cannot edit the content.

This "published" version is a snapshot in time. If the original author continues to edit their local entry, the shared link will not be updated. This is by design, ensuring that a published link is a stable, permanent record of the text at that moment.

3. Technical Implementation (Frontend-Only)
This entire feature will be built within the existing React application, with no backend infrastructure required. The core mechanism is data serialization directly into the URL fragment.

3.1. Core Mechanism: URL Fragment Serialization

We will use the URL's hash (the part after the #) to store the entire content of the note. This is ideal because browsers do not send the URL fragment to the server, making it a purely client-side state mechanism.

3.2. Encoding the Content

Plain text cannot be directly placed in a URL due to special characters. We will encode the content using a two-step process:

Stringify: The content (and potentially metadata like font choice) will be structured as a JSON object.

{
  "c": "This is the full text content of the note...",
  "f": "Lora", // Font name
  "t": "light" // Theme
}

Encode to Base64: This JSON string will be encoded into a Base64 string using the browser's built-in btoa() function. Base64 is a standard way to represent binary data in an ASCII string format.

Make it URL-Safe: Standard Base64 can include characters (+, /, =) that have special meaning in URLs. We will convert the Base64 string to a URL-safe variant by replacing these characters.

3.3. Routing

A new client-side route will be created using a hash router pattern: /#/s/:data.

The s stands for "share".

:data is a dynamic parameter that will hold our URL-safe Base64 string.

Example URL: https://freespeak.vercel.app/#/s/eyJjIjoiSGVsbG8gV29ybGQiLCJmIjoiSW50ZXIifQ

3.4. The "Share" View Component

A new React component will be created to handle the /s/:data route. Its responsibilities are:

Read from URL: On mount, it will read the :data parameter from the URL.

Decode: It will reverse the encoding process:

Convert the URL-safe Base64 string back to standard Base64.

Decode the Base64 string back into the JSON string using atob().

Parse the JSON string using JSON.parse().

Render Content: It will use the parsed object to render the content (c), apply the correct font style (f), and set the theme (t). The content will be displayed in a non-editable <div> to ensure it is read-only.

4. Advantages of this Approach
Zero Backend Cost & Complexity: The feature runs entirely in the user's browser, requiring no database or server-side logic.

Ultimate Privacy: A user's notes are never sent to a server unless they explicitly click the "Share" button. All data remains local by default.

Instantaneous: Link generation is immediate as it's just a client-side computation.

Robust & Permanent: As long as the URL is preserved, the content is preserved within it.

5. Important Limitations & Considerations
URL Length Limit: This is the most significant constraint. Browsers have a practical limit on URL length (typically around 2,000 characters). This means the feature is suitable for notes, articles, and drafts of a reasonable length, but not for extremely long documents like a full book manuscript. We must be transparent about this limitation in the UI.

No Real-Time Updates: The shared link is a static snapshot. This is a feature, not a bug, for this implementation, but it's important to clarify.

No Analytics or Control: Once a link is created and shared, the author cannot revoke it or track its views.

This frontend-only approach provides a powerful and elegant solution that aligns perfectly with Freespeak's minimalist and privacy-first ethos.