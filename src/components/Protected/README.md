# Protected Component

The `Protected` component is a Higher Order Component (HOC) that restricts access to pages based on user roles. It ensures that only authorized users can access specific pages in the admin dashboard.

## Usage

To use the Protected component, simply wrap your page component with it and specify the required roles:

```tsx
import Protected from '@/components/Protected/Protected';

function MyAdminPage() {
  // Your component code
}

// Allow only admin users to access this page
export default Protected(MyAdminPage, ["admin"]);
```

Or for pages that can be accessed by multiple roles:

```tsx
// Allow both admin and helpdesk users to access this page
export default Protected(HelpdeskPage, ["admin", "helpdesk"]);
```

## How It Works

The Protected component:

1. Checks if a user is authenticated (redirects to login if not)
2. Verifies if the authenticated user has one of the required roles
3. Shows a toast error and redirects unauthorized users
4. Renders a loading spinner during authentication checks
5. Renders the wrapped component only for authorized users

## Available Roles

The following roles are currently supported:

- `admin`: Full access to all pages
- `helpdesk`: Access to support/helpdesk related pages
- Additional roles can be added as needed

## Adding Protection to New Pages

When creating a new admin page, always wrap it with the Protected component to ensure proper access control.

```tsx
import Protected from '@/components/Protected/Protected';

function NewAdminFeature() {
  // Your component code
}

export default Protected(NewAdminFeature, ["admin"]);
``` 