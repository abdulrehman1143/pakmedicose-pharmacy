-- Pakistan Common Medicines Database
-- Insert into medicines table

INSERT INTO medicines (name, generic_name, sku, quantity, expiry_date, cost_price, selling_price, category, supplier_id) VALUES

-- PAINKILLERS / درد کی دوائیں
('Paracetamol 500mg', 'Paracetamol', 'PARA-500-TAB', 100, '2026-12-31', 2, 5, 'Painkillers', NULL),
('Aspirin 325mg', 'Acetylsalicylic Acid', 'ASPR-325-TAB', 80, '2026-12-31', 3, 7, 'Painkillers', NULL),
('Ibuprofen 400mg', 'Ibuprofen', 'IBUF-400-TAB', 50, '2026-12-31', 5, 12, 'Painkillers', NULL),
('Brufen 400mg', 'Ibuprofen', 'BFIN-400-TAB', 60, '2026-12-31', 6, 15, 'Painkillers', NULL),
('Dispirin 500mg', 'Aspirin', 'DISP-500-TAB', 70, '2026-12-31', 4, 10, 'Painkillers', NULL),

-- ANTIBIOTICS / اینٹی بایوٹکس
('Amoxicillin 500mg', 'Amoxicillin', 'AMOX-500-CAP', 100, '2026-12-31', 8, 20, 'Antibiotics', NULL),
('Azithromycin 500mg', 'Azithromycin', 'AZIT-500-TAB', 60, '2026-12-31', 15, 40, 'Antibiotics', NULL),
('Ciprofloxacin 500mg', 'Ciprofloxacin', 'CIPRO-500-TAB', 40, '2026-12-31', 10, 25, 'Antibiotics', NULL),
('Augmentin 625mg', 'Amoxicillin+Clavulanic Acid', 'AUGM-625-TAB', 80, '2026-12-31', 20, 50, 'Antibiotics', NULL),
('Cefixime 200mg', 'Cefixime', 'CEFI-200-CAP', 50, '2026-12-31', 12, 30, 'Antibiotics', NULL),

-- COUGH & COLD / کھانسی اور سردی
('Robitussin Cough', 'Dextromethorphan', 'ROBI-DM-SYP', 30, '2026-12-31', 80, 150, 'Cough/Cold', NULL),
('Strepsils Lozenges', 'Amylmetacresol', 'STREP-LOZ-BOX', 50, '2026-12-31', 15, 35, 'Cough/Cold', NULL),
('Benadryl Cough', 'Diphenhydramine', 'BENA-COUGH-SYP', 25, '2026-12-31', 90, 180, 'Cough/Cold', NULL),
('Aspirin Plus C', 'Aspirin+Vitamin C', 'ASPR-C-EFF', 60, '2026-12-31', 8, 18, 'Cough/Cold', NULL),
('Cough Syrup (Generic)', 'Dextromethorphan+Guaifenesin', 'COUGH-SYP-GEN', 40, '2026-12-31', 50, 100, 'Cough/Cold', NULL),

-- DIGESTIVE / ہاضمہ کی دوائیں
('Flagyl 400mg', 'Metronidazole', 'FLAG-400-TAB', 100, '2026-12-31', 5, 12, 'Digestive', NULL),
('Antacid Gel', 'Aluminum Hydroxide', 'ANTAC-GEL-BOT', 20, '2026-12-31', 40, 90, 'Digestive', NULL),
('Digene Tablet', 'Aluminum+Magnesium', 'DIGN-TAB-BOX', 80, '2026-12-31', 3, 8, 'Digestive', NULL),
('Nexium 20mg', 'Esomeprazole', 'NEXM-20-CAP', 50, '2026-12-31', 25, 60, 'Digestive', NULL),
('Ondansetron 4mg', 'Ondansetron', 'ONDA-4-TAB', 60, '2026-12-31', 8, 20, 'Digestive', NULL),

-- VITAMINS & SUPPLEMENTS / وٹامنز
('Vitamin D 1000IU', 'Cholecalciferol', 'VITD-1000-CAP', 120, '2026-12-31', 3, 8, 'Vitamins', NULL),
('Vitamin B Complex', 'B1+B2+B3+B5+B6+B12', 'VITB-COMP-TAB', 100, '2026-12-31', 5, 12, 'Vitamins', NULL),
('Vitamin C 500mg', 'Ascorbic Acid', 'VITC-500-TAB', 150, '2026-12-31', 2, 6, 'Vitamins', NULL),
('Calcium Citrate 500mg', 'Calcium', 'CALC-500-TAB', 80, '2026-12-31', 8, 18, 'Vitamins', NULL),
('Iron Supplement', 'Ferrous Sulfate', 'IRON-TAB', 100, '2026-12-31', 4, 10, 'Vitamins', NULL),

-- SKIN CARE / جلد کی دیکھ بھال
('Hydroquinone Cream 4%', 'Hydroquinone', 'HYDR-CREM-4', 20, '2026-12-31', 80, 180, 'Skin', NULL),
('Tretinoin Cream 0.025%', 'Tretinoin', 'TRET-CREM-025', 15, '2026-12-31', 120, 280, 'Skin', NULL),
('Sunscreen SPF 50', 'Sunscreen', 'SUNSC-50-BOT', 40, '2026-12-31', 150, 350, 'Skin', NULL),
('Neem Face Wash', 'Neem Extract', 'NEEM-WASH-BOT', 50, '2026-12-31', 100, 200, 'Skin', NULL),
('Acne Gel', 'Benzoyl Peroxide 5%', 'ACNE-GEL-TUB', 30, '2026-12-31', 70, 160, 'Skin', NULL),

-- ALLERGY / الرجی کی دوائیں
('Cetirizine 10mg', 'Cetirizine', 'CETI-10-TAB', 100, '2026-12-31', 3, 8, 'Allergy', NULL),
('Loratadine 10mg', 'Loratadine', 'LORA-10-TAB', 80, '2026-12-31', 4, 10, 'Allergy', NULL),
('Fexofenadine 120mg', 'Fexofenadine', 'FEXO-120-TAB', 60, '2026-12-31', 6, 15, 'Allergy', NULL),
('Diphenhydramine 25mg', 'Diphenhydramine', 'DIPH-25-TAB', 50, '2026-12-31', 5, 12, 'Allergy', NULL),
('Anti-Allergy Syrup', 'Pheniramine Maleate', 'ALRG-SYP-BOT', 25, '2026-12-31', 60, 140, 'Allergy', NULL),

-- BLOOD PRESSURE / بلڈ پریشر کی دوائیں
('Amlodipine 5mg', 'Amlodipine', 'AMLO-5-TAB', 100, '2026-12-31', 8, 20, 'Other', NULL),
('Lisinopril 10mg', 'Lisinopril', 'LISI-10-TAB', 80, '2026-12-31', 6, 15, 'Other', NULL),
('Metoprolol 50mg', 'Metoprolol', 'METO-50-TAB', 60, '2026-12-31', 7, 18, 'Other', NULL),
('Atenolol 50mg', 'Atenolol', 'ATEN-50-TAB', 70, '2026-12-31', 5, 12, 'Other', NULL),

-- DIABETES / ذیابیطس کی دوائیں
('Metformin 500mg', 'Metformin', 'METF-500-TAB', 120, '2026-12-31', 4, 10, 'Other', NULL),
('Glibenclamide 5mg', 'Glibenclamide', 'GLIB-5-TAB', 90, '2026-12-31', 5, 12, 'Other', NULL),
('Insulin Pen', 'Insulin', 'INSUL-PEN', 30, '2026-12-31', 500, 1200, 'Other', NULL),

-- POPULAR BRANDS
('Aspirin Bayer', 'Aspirin', 'ASPBYR-100TAB', 50, '2026-12-31', 4, 10, 'Painkillers', NULL),
('Strepsils', 'Amylmetacresol', 'STRP-LOZ', 40, '2026-12-31', 20, 45, 'Cough/Cold', NULL),
('Combiflam', 'Ibuprofen+Paracetamol', 'COMBF-TAB', 60, '2026-12-31', 6, 15, 'Painkillers', NULL),
('Crocin', 'Paracetamol', 'CROCN-500TAB', 80, '2026-12-31', 3, 8, 'Painkillers', NULL),
('Amla Juice', 'Vitamin C', 'AMLA-JUC-BOT', 20, '2026-12-31', 120, 280, 'Vitamins', NULL);
