'use client';
import dynamic from 'next/dynamic';
const Dashboard = dynamic(() => import('../components/dashboard').then((m) => m.Dashboard), { ssr: false, loading: () => <main className="shell">Loading TaskFlow…</main> });
export default function Home() { return <Dashboard />; }
