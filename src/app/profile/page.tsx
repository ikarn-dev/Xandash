import { redirect } from 'next/navigation';

export default function ProfilePage() {
  // Redirect to nodes page if someone lands on /profile without an IP
  redirect('/nodes');
}
