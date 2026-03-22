import * as React from 'react';
import { Html, Head, Body, Container, Text, Heading, Button, Hr, Section, Preview, Row, Column } from '@react-email/components';

interface OrderEmailProps {
  customerName: string;
  orderId: string;
  amount: number | string;
}

export const OrderEmail = ({ customerName, orderId, amount }: OrderEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your ZERIMI Luxury Selection is Confirmed - #{orderId}</Preview>
      <Body style={main}>
        <Container style={container}>
          
          {/* 1. Thin Gold Line (Subtle Luxury) */}
          <Section style={goldBar}></Section>

          {/* 2. Minimalist Header */}
          <Section style={headerSection}>
            <Heading style={brand}>ZERIMI</Heading>
            <Text style={subtitle}>LUXURY REDEFINED</Text>
          </Section>

          <Hr style={thinHr} />
          
          {/* 3. Elegant Content Area */}
          <Section style={contentSection}>
            <Text style={greeting}>Dear {customerName},</Text>
            <Text style={paragraph}>
              It is our pleasure to confirm your order. Your selection is being meticulously prepared for its journey to you. We hope it brings you immense joy.
            </Text>

            {/* 4. Elegant Order Summary (Table-based for compatibility) */}
            <Section style={card}>
              <Row style={{ marginBottom: '15px' }}>
                <Column>
                  <Text style={label}>ORDER REFERENCE</Text>
                  <Text style={value}>#{orderId}</Text>
                </Column>
              </Row>
              <Hr style={cardDivider} />
              <Row style={{ marginTop: '15px' }}>
                <Column>
                  <Text style={label}>TOTAL AMOUNT</Text>
                </Column>
                <Column align="right">
                  <Text style={amountText}>₹{amount}</Text>
                </Column>
              </Row>
            </Section>

            {/* 5. Minimalist CTA */}
           {/* 5. Updated CTA for Tracking */}
<Section style={btnContainer}>
  <Button 
    style={button} 
    href={`https://zerimi.in/track-order?id=${orderId}`} // Yahan track-order page ka link
  >
    TRACK YOUR ORDER
  </Button>
</Section>
          </Section>

          <Hr style={thinHr} />

          {/* 6. Clean Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>© 2026 ZERIMI Luxury. All rights reserved.</Text>
            <Text style={footerText}>Baghpat, Uttar Pradesh, India</Text>
            <Text style={footerText}>info@zerimi.in</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderEmail;

// --- LUXURY STYLES (Black, White & Gold) ---
const main = {
  backgroundColor: '#f6f6f6', // Ultra-light grey background
  fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif', // Clean, high-end font
  WebkitFontSmoothing: 'antialiased',
};

const container = {
  margin: '0 auto',
  backgroundColor: '#ffffff',
  maxWidth: '600px',
  border: '1px solid #e0e0e0', // Very subtle border
};

const goldBar = {
  width: '100%',
  height: '4px', // Thinner line for subtlety
  backgroundColor: '#d4af37', // True Gold
};

const headerSection = {
  padding: '50px 20px 30px',
  textAlign: 'center' as const,
};

const brand = {
  fontSize: '34px',
  fontWeight: '300', // Thinner weight for elegance
  letterSpacing: '8px', // High letter-spacing
  margin: '0',
  color: '#000000',
  textTransform: 'uppercase' as const,
};

const subtitle = {
  fontSize: '11px',
  color: '#d4af37', // Gold
  letterSpacing: '5px',
  marginTop: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
};

const contentSection = {
  padding: '40px 50px',
};

const greeting = {
  fontSize: '19px',
  fontWeight: '400',
  color: '#1a1a1a',
  marginBottom: '20px',
};

const paragraph = {
  fontSize: '15px',
  lineHeight: '26px',
  color: '#555555',
  marginBottom: '35px',
  fontWeight: '300',
};

const card = {
  backgroundColor: '#ffffff',
  padding: '25px',
  border: '1px solid #f0f0f0', // Incredibly subtle card border
  marginBottom: '40px',
};

const label = {
  fontSize: '11px',
  color: '#999999',
  textTransform: 'uppercase' as const,
  letterSpacing: '1.5px',
  margin: '0 0 5px 0',
  fontWeight: '500',
};

const value = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#000000',
  margin: '0',
};

const amountText = {
  fontSize: '22px',
  fontWeight: '700',
  color: '#d4af37', // Gold for the main number
  margin: '0',
};

const cardDivider = {
  borderColor: '#f0f0f0',
  margin: '0',
};

const btnContainer = {
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#000000', // Solid black button
  color: '#ffffff',
  padding: '18px 40px',
  border: '1px solid #000000',
  fontSize: '13px',
  fontWeight: '600',
  textDecoration: 'none',
  textTransform: 'uppercase' as const,
  letterSpacing: '2px', // Minimal spacing for CTA
  borderRadius: '0', // Sharp corners for premium look
};

const thinHr = {
  borderColor: '#eeeeee',
  margin: '0',
};

const footerSection = {
  padding: '40px',
  backgroundColor: '#ffffff',
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '12px',
  color: '#bbbbbb',
  margin: '6px 0',
  fontWeight: '300',
  letterSpacing: '0.5px',
};