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
  const cleanPhone = phoneNumber.replace(/\D/g, '');

  let message = '';

  if (type === 'driver') {
    message = `Olá ${details.name}! Vi sua disponibilidade de ${details.vehicle} para ${details.route} no dia ${details.date} às ${details.time}. Gostaria de mais informações.`;
  } else {
    message = `Olá ${details.name}! Vi sua oferta de viagem para ${details.route} no dia ${details.date} às ${details.time}. Posso ajudar com o transporte.`;
  }

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/55${cleanPhone}?text=${encodedMessage}`;
}

export function generateShareText(driver: {
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  available_seats: number;
  service_type?: string | null;
  vehicle_info?: string | null;
}): string {
  const [year, month, day] = driver.departure_date.split('-');
  const dateFormatted = `${day}/${month}/${year}`;

  const serviceLabel =
    driver.service_type === 'ambos'
      ? 'Coletivo e Privativo'
      : driver.service_type
        ? driver.service_type.charAt(0).toUpperCase() + driver.service_type.slice(1)
        : 'Coletivo';

  return `🚗 Serra Conecta
📍 ${driver.origin} → ${driver.destination}
📅 ${dateFormatted} às ${driver.departure_time}
🪑 ${driver.available_seats} lugar(es) | ${serviceLabel}
🚙 ${driver.vehicle_info || 'Veículo não informado'}
📲 Ver e contatar: https://serraconecta.lovable.app/drivers`;
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
  
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  
  return phone;
}