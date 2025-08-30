export function generateWhatsAppLink(
  phoneNumber: string,
  type: 'driver' | 'trip',
  details: {
    name: string;
    route: string;
    date?: string;
    time: string;
    vehicle?: string;
    capacity?: number;
    adults?: number;
    children?: number;
  }
): string {
  // Remove formatting from phone number
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  let message = '';
  
  if (type === 'driver') {
    message = `Olá ${details.name}! Vi sua disponibilidade de ${details.vehicle} para ${details.route} às ${details.time}. Gostaria de mais informações.`;
  } else {
    message = `Olá ${details.name}! Vi sua oferta de viagem para ${details.route} no dia ${details.date} às ${details.time}. Posso ajudar com o transporte.`;
  }
  
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/55${cleanPhone}?text=${encodedMessage}`;
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
  
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  
  return phone;
}