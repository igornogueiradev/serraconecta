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

  const dateFormatted = details.date
    ? details.date.split('-').reverse().join('/')
    : '';

  let message = '';

  if (type === 'driver') {
    message = `Olá ${details.name}! Vi sua disponibilidade de ${details.vehicle} para ${details.route} no dia ${dateFormatted} às ${details.time}. Gostaria de mais informações.`;
  } else {
    message = `Olá ${details.name}! Vi seu repasse de clientes para ${details.route} no dia ${dateFormatted} às ${details.time}. Tenho disponibilidade para realizar o transporte.`;
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
  additional_info?: string | null;
  has_trailer?: boolean;
  has_rooftop_carrier?: boolean;
}): string {
  const [year, month, day] = driver.departure_date.split('-');
  const dateFormatted = `${day}/${month}/${year}`;

  const serviceLabel =
    driver.service_type === 'ambos'
      ? 'Coletivo e Privativo'
      : driver.service_type
        ? driver.service_type.charAt(0).toUpperCase() + driver.service_type.slice(1)
        : 'Coletivo';

  const extrasParts = [
    driver.has_trailer ? 'Reboque' : '',
    driver.has_rooftop_carrier ? 'Bagageiro' : '',
  ].filter(Boolean).join(' | ');
  const extras = extrasParts ? `\n🔧 ${extrasParts}` : '';
  const obs = driver.additional_info ? `\n📝 ${driver.additional_info}` : '';

  return `🚗 Tenho vagas disponíveis
📍 ${driver.origin} → ${driver.destination}
📅 ${dateFormatted} às ${driver.departure_time}
🪑 ${driver.available_seats} lugar(es) | ${serviceLabel}
🚙 ${driver.vehicle_info || 'Veículo não informado'}${extras}${obs}
📲 Ver e reservar: https://serraconecta-1737c.web.app/drivers`;
}

export function generateTripShareText(trip: {
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  adults_count: number;
  children_count: number;
  service_type?: string | null;
  baggage_23kg: number;
  baggage_10kg: number;
  baggage_bags: number;
  additional_info?: string | null;
}): string {
  const [year, month, day] = trip.departure_date.split('-');
  const dateFormatted = `${day}/${month}/${year}`;

  const serviceLabel = trip.service_type
    ? trip.service_type.charAt(0).toUpperCase() + trip.service_type.slice(1)
    : 'Coletivo';

  const passengers = trip.children_count > 0
    ? `${trip.adults_count} adulto(s) + ${trip.children_count} criança(s)`
    : `${trip.adults_count} adulto(s)`;

  const baggageParts = [
    trip.baggage_23kg > 0 ? `${trip.baggage_23kg}×23kg` : '',
    trip.baggage_10kg > 0 ? `${trip.baggage_10kg}×10kg` : '',
    trip.baggage_bags > 0 ? `${trip.baggage_bags} bolsa(s)` : '',
  ].filter(Boolean).join(' | ');

  const baggage = baggageParts ? `\n🧳 ${baggageParts}` : '';
  const obs = trip.additional_info ? `\n📝 ${trip.additional_info}` : '';

  return `🧳 Preciso de transporte
📍 ${trip.origin} → ${trip.destination}
📅 ${dateFormatted} às ${trip.departure_time}
👥 ${passengers} | ${serviceLabel}${baggage}${obs}
📲 Ver e aceitar: https://serraconecta-1737c.web.app/trips`;
}

export function generateOwnerWhatsAppLink(
  requesterPhone: string,
  type: 'driver' | 'trip',
  details: {
    requesterName: string;
    route: string;
    date?: string;
    time?: string;
  }
): string {
  const cleanPhone = requesterPhone.replace(/\D/g, '');
  const dateFormatted = details.date
    ? details.date.split('-').reverse().join('/')
    : '';
  const when = details.date && details.time
    ? ` no dia ${dateFormatted} às ${details.time}`
    : '';

  const message = type === 'driver'
    ? `Olá ${details.requesterName}! Aceitei sua solicitação de disponibilidade para ${details.route}${when}. Vamos acertar os detalhes?`
    : `Olá ${details.requesterName}! Aceitei sua solicitação de repasse para ${details.route}${when}. Vamos acertar os detalhes?`;

  return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function generateQuestionarioLink(agendamentoId: string): string {
  return `https://app.meuexecutivogramado.com.br/q/${agendamentoId}`;
}

function formatarDataBR(data: string): string {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function generateQuestionarioWhatsApp(agendamento: {
  id: string;
  clienteNome?: string;
  data: string;
  hora: string;
  ida_e_volta?: boolean;
  data_volta?: string;
  hora_volta?: string;
}): string {
  const link = generateQuestionarioLink(agendamento.id);
  const primeiroNome = agendamento.clienteNome?.split(' ')[0];
  const saudacao = primeiroNome ? `Olá, ${primeiroNome}!` : 'Olá!';

  const detalhes = agendamento.ida_e_volta && agendamento.data_volta && agendamento.hora_volta
    ? `🛬 *Chegada (IN):* ${formatarDataBR(agendamento.data)} às ${agendamento.hora}\n` +
      `🛫 *Saída (OUT):* ${formatarDataBR(agendamento.data_volta)} às ${agendamento.hora_volta}`
    : `*${formatarDataBR(agendamento.data)} às ${agendamento.hora}*`;

  const message =
    `${saudacao} 👋\n\n` +
    `Para confirmarmos os detalhes do seu transporte, pedimos que preencha o formulário abaixo:\n\n` +
    `${detalhes}\n\n` +
    `${link}\n\n` +
    `Após preencher, você poderá baixar seu *Voucher de Agendamento* direto na página, clicando no botão "Baixar meu Voucher". 🎫\n\n` +
    `Obrigado! 🙏`;

  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
  
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  
  return phone;
}