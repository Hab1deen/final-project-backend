import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const q = await prisma.quotation.findFirst({
        orderBy: { id: 'desc' }
    });
    console.log("Latest Quotation:", q?.id, q?.quotationNo, "Token:", q?.approvalToken);
}
main();
