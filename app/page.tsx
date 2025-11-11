import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to games page as the landing page
  redirect('/games');
}
