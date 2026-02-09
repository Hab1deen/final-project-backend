const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearDatabase() {
    try {
        console.log('🗑️  กำลังลบข้อมูลทั้งหมด...\n');

        // ลบข้อมูลตามลำดับ foreign key
        console.log('Deleting Payments...');
        await prisma.payment.deleteMany({});

        console.log('Deleting InvoiceItems...');
        await prisma.invoiceItem.deleteMany({});

        console.log('Deleting Invoices...');
        await prisma.invoice.deleteMany({});

        console.log('Deleting QuotationItems...');
        await prisma.quotationItem.deleteMany({});

        console.log('Deleting Quotations...');
        await prisma.quotation.deleteMany({});

        console.log('Deleting Products...');
        await prisma.product.deleteMany({});

        console.log('Deleting Customers...');
        await prisma.customer.deleteMany({});

        console.log('Deleting Users...');
        await prisma.user.deleteMany({});

        console.log('\n✅ ลบข้อมูลทั้งหมดสำเร็จ!');
        console.log('📝 Schema ยังคงอยู่ พร้อมเพิ่มข้อมูลใหม่');

    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

clearDatabase()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
