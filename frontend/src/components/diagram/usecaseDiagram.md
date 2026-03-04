usecaseDiagram
    actor "User (พนักงานขาย/บัญชี)" as U
    actor "Admin (ผู้ดูแลระบบ)" as A
    
    package "Billing & Quotation System" {
        usecase "Login / Logout" as UC1
        usecase "ดู Dashboard ภาพรวม" as UC2
        
        usecase "จัดการข้อมูลลูกค้า (CRUD)" as UC3
        usecase "จัดการสินค้า/บริการ (CRUD)" as UC4
        
        usecase "สร้างใบเสนอราคา (Quotation)" as UC5
        usecase "แปลงใบเสนอราคาเป็นใบแจ้งหนี้" as UC6
        
        usecase "สร้างใบแจ้งหนี้ (Invoice)" as UC7
        usecase "ออกใบเสร็จรับเงิน (Receipt)" as UC8
        note right of UC8 : รองรับเฉพาะยอดเต็มจำนวน (Full Payment)
        
        usecase "จัดการผู้ใช้งานระบบ" as UC9
    }

    U --> UC1
    U --> UC2
    U --> UC3
    U --> UC4
    U --> UC5
    U --> UC6
    U --> UC7
    U --> UC8

    A --> UC1
    A --> UC2
    A --> UC9
    
    %% Admin ทำได้ทุกอย่างที่ User ทำได้
    A --|> U