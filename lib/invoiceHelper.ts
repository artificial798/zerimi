// File: lib/invoiceHelper.ts

export const downloadInvoice = (order: any, settings: any) => {
    if (!order) return;

    // 1. Settings se Data nikalo (Jo Admin ne save kiya hai)
    const companyName = settings?.invoice?.companyName || "ZERIMI JEWELS";
    const companyAddress = settings?.invoice?.address || "Mumbai, India";
    const gstin = settings?.invoice?.gstin || "";
    const terms = settings?.invoice?.terms || "Computer generated invoice.";
    const logoUrl = settings?.invoice?.logoUrl || "";

    // 2. Calculations
    const taxRate = Number(settings?.store?.taxRate) || 3;
    const total = order.total || 0;
    const subTotal = order.subtotal || (total / (1 + taxRate / 100));
    const taxAmount = total - subTotal;
    const shipping = Number(settings?.store?.shippingCost) || 0;
    
    // Items & Date
    const items = order.items || [];
    const date = order.date || new Date().toLocaleDateString();
    
    // Address Setup
    const addressStr = typeof order.address === 'object' 
        ? `${order.address.street || ''}, ${order.address.city || ''} - ${order.address.pincode || ''}` 
        : order.address || 'Address Not Provided';

    // 3. Print Window Open
    const printWindow = window.open('', '_blank');
    if (!printWindow) { 
        alert("Please allow popups to download the invoice."); 
        return; 
    }

    // 4. HTML Template (Professional Design)
    const html = `
    <html>
    <head>
        <title>Invoice #${order.invoiceNo || order.id}</title>
        <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; line-height: 1.4; font-size: 13px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .logo { height: 60px; margin-bottom: 10px; object-fit: contain; }
            .company { font-size: 22px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
            .details { font-size: 12px; color: #666; margin-top: 5px; }
            
            .row { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .col { width: 48%; }
            .label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #999; border-bottom: 1px solid #eee; margin-bottom: 8px; padding-bottom: 2px; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f4f4f4; text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #ddd; }
            td { padding: 10px; border-bottom: 1px solid #eee; }
            .right { text-align: right; }
            .total-row td { font-size: 15px; font-weight: bold; border-top: 2px solid #333; padding-top: 15px; }
            
            .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #888; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
    </head>
    <body>
        <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" class="logo" />` : ''}
            <div class="company">${companyName}</div>
            <div class="details">${companyAddress}</div>
            ${gstin ? `<div class="details">GSTIN: ${gstin}</div>` : ''}
        </div>

        <div class="row">
            <div class="col">
                <div class="label">Billed To</div>
                <strong style="font-size: 14px;">${order.customerName}</strong><br>
                ${addressStr}<br>
                Phone: ${order.phone || 'N/A'}<br>
                ${order.customerEmail || ''}
            </div>
            <div class="col right">
                <div class="label" style="text-align: right;">Invoice Details</div>
                <strong>No:</strong> ${order.invoiceNo || order.id}<br>
                <strong>Date:</strong> ${date}<br>
                <strong>Status:</strong> ${order.status}
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width: 5%">#</th>
                    <th style="width: 50%">Item</th>
                    <th style="width: 15%">Qty</th>
                    <th style="width: 15%" class="right">Price</th>
                    <th style="width: 15%" class="right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${items.map((item: any, i: number) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${item.name}<br><small style="color:#888">${item.size || ''}</small></td>
                    <td>${item.qty}</td>
                    <td class="right">₹${item.price.toLocaleString()}</td>
                    <td class="right">₹${(item.price * item.qty).toLocaleString()}</td>
                </tr>`).join('')}
            </tbody>
            <tfoot>
                <tr><td colspan="4" class="right" style="border:none">Subtotal</td><td class="right" style="border:none">₹${subTotal.toLocaleString(undefined, {maximumFractionDigits: 2})}</td></tr>
                <tr><td colspan="4" class="right" style="border:none">Tax (${taxRate}%)</td><td class="right" style="border:none">₹${taxAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</td></tr>
                <tr><td colspan="4" class="right" style="border:none">Shipping</td><td class="right" style="border:none">₹${shipping}</td></tr>
                <tr class="total-row"><td colspan="4" class="right">Grand Total</td><td class="right">₹${total.toLocaleString()}</td></tr>
            </tfoot>
        </table>

        <div class="footer">
            <strong>Terms & Conditions:</strong><br>${terms}<br><br>
            Thank you for shopping with ${companyName}
        </div>
        <script>window.print();</script>
    </body>
    </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
};