import ClientDetailsClient from './ClientDetailsClient';

export default async function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClientDetailsClient id={id} />;
}
