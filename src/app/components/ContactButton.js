// components/ContactButton.js
import { Phone, MessageCircle, Send, Mail } from "lucide-react";

const ContactButton = ({ type, value, className = "" }) => {
  const cleanPhone = (phone) => phone?.replace(/\D/g, '') || '';
  
  const getContactInfo = () => {
    switch (type) {
      case 'whatsapp':
        return {
          icon: <MessageCircle className="w-4 h-4" />,
          label: 'واتساب',
          href: `https://wa.me/963${cleanPhone(value)}`,
          bgColor: 'bg-green-500 hover:bg-green-600',
          textColor: 'text-white'
        };
      case 'telegram':
        return {
          icon: <Send className="w-4 h-4" />,
          label: 'تيليجرام',
          href: `https://t.me/+963${cleanPhone(value)}`,
          bgColor: 'bg-blue-500 hover:bg-blue-600',
          textColor: 'text-white'
        };
      case 'phone':
        return {
          icon: <Phone className="w-4 h-4" />,
          label: 'اتصال',
          href: `tel:+963${cleanPhone(value)}`,
          bgColor: 'bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500',
          textColor: 'text-white'
        };
      case 'email':
        return {
          icon: <Mail className="w-4 h-4" />,
          label: 'بريد إلكتروني',
          href: `mailto:${value}`,
          bgColor: 'bg-red-500 hover:bg-red-600',
          textColor: 'text-white'
        };
      default:
        return null;
    }
  };

  const contactInfo = getContactInfo();
  
  if (!contactInfo || !value) {
    return null;
  }

  return (
    <a
      href={contactInfo.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 
        ${contactInfo.bgColor} ${contactInfo.textColor}
        hover:shadow-md dark:hover:shadow-gray-900/50 hover:scale-105 active:scale-95
        ${className}
      `}
    >
      {contactInfo.icon}
    </a>
  );
};

export default ContactButton;