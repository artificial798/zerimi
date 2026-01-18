import * as React from 'react';
import { Html, Head, Body, Container, Text, Heading, Button, Hr, Section, Preview } from '@react-email/components';

interface OrderEmailProps {
  customerName: string;
  orderId: string;
  amount: number | string;
}

export const OrderEmail = ({ customerName, orderId, amount }: OrderEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your ZERIMI Order Confirmation - #{orderId}</Preview>
      <Body style={main}>
        <Container style={container}>
          
          {/* 1. Luxury Top Bar */}
          <Section style={goldBar}></Section>

          {/* 2. Brand Header */}
          <Section style={headerSection}>
            <Heading style={brand}>ZERIMI</Heading>
            <Text style={subtitle}>LUXURY REDEFINED</Text>
          </Section>

          <Hr style={hr} />
          
          {/* 3. Greeting & Message */}
          <Section style={contentSection}>
            <Text style={greeting}>Hello {customerName},</Text>
            <Text style={paragraph}>
              Thank you for choosing ZERIMI. Your order has been successfully placed. We are getting your luxury selection ready for dispatch.
            </Text>

            {/* 4. Order Details Card */}
            <Section style={card}>
              <div style={row}>
                <Text style={label}>Order Number</Text>
                <Text style={value}>#{orderId}</Text>
              </div>
              <Hr style={cardDivider} />
              <div style={row}>
                <Text style={label}>Total Amount</Text>
                <Text style={amountText}>₹{amount}</Text>
              </div>
            </Section>

            {/* 5. Call to Action Button */}
            <Section style={btnContainer}>
              <Button style={button} href={`https://zerimi.com/orders/${orderId}`}>
                View Your Order
              </Button>
            </Section>
          </Section>

          <Hr style={hr} />

          {/* 6. Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>© 2026 ZERIMI. All rights reserved.</Text>
            <Text style={footerText}>Baghpat, Uttar Pradesh, India</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderEmail;

// --- LUXURY STYLES (Black, White & Gold) ---
const main = {
  backgroundColor: '#f8f5f2', // Light cream background (Premium feel)
  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '0',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  overflow: 'hidden',
  maxWidth: '600px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  border: '1px solid #e6e6e6',
};

const goldBar = {
  width: '100%',
  height: '6px',
  backgroundColor: '#d4af37', // Gold Color
};

const headerSection = {
  padding: '40px 20px 20px',
  textAlign: 'center' as const,
};

const brand = {
  fontSize: '36px',
  fontWeight: 'bold',
  letterSpacing: '4px',
  margin: '0',
  color: '#0a1f1c', // Dark Green/Black
};

const subtitle = {
  fontSize: '12px',
  color: '#d4af37', // Gold
  letterSpacing: '3px',
  marginTop: '8px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
};

const contentSection = {
  padding: '30px 40px',
};

const greeting = {
  fontSize: '20px',
  fontWeight: '300',
  color: '#333',
  marginBottom: '16px',
};

const paragraph = {
  fontSize: '15px',
  lineHeight: '26px',
  color: '#555',
  marginBottom: '24px',
};

const card = {
  backgroundColor: '#fafafa',
  padding: '24px',
  borderRadius: '6px',
  border: '1px solid #eeeeee',
  marginBottom: '30px',
};

const row = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const label = {
  fontSize: '12px',
  color: '#888',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0',
};

const value = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#000',
  margin: '0',
};

const amountText = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#d4af37', // Gold
  margin: '0',
};

const cardDivider = {
  borderColor: '#eeeeee',
  margin: '15px 0',
};

const btnContainer = {
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#0a1f1c', // Dark Brand Color
  color: '#ffffff',
  padding: '16px 36px',
  borderRadius: '4px',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
};

const hr = {
  borderColor: '#f0f0f0',
  margin: '0',
};

const footerSection = {
  padding: '30px',
  backgroundColor: '#fafafa',
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '12px',
  color: '#999',
  margin: '4px 0',
};

const thinDivider = { 
    // Helper style agar zaroorat padi toh
};