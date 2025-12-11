#SELECT * FROM pur_vndr_hdr_t LIMIT 20 vndr_us_tax_nbr


#SELECT * FROM CA_UH_ACCT_SPRVSR_DLGT_T LIMIT 10;
#SELECT COUNT(*) FROM CA_UH_ACCT_SPRVSR_DLGT_T;
-- Check the related delegate table
#SELECT 'CA_ACCT_DELEGATE_T' as TABLE_NAME, COUNT(*) as ROW_COUNT FROM CA_ACCT_DELEGATE_T
#UNION ALL
#SELECT 'CA_UH_ACCT_SPRVSR_DLGT_T' as TABLE_NAME, COUNT(*) as ROW_COUNT FROM CA_UH_ACCT_SPRVSR_DLGT_T;
#SELECT * FROM KRCR_PARM_T LIMIT 10;

SELECT COLUMN_NAME 
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'CA_ACCT_DELEGATE_T'
AND COLUMN_NAME LIKE '%END%';

/*
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME, ORDINAL_POSITION;
*/

#SELECT explanation FROM fs_doc_header_t LIMIT 5;


/*
SELECT DISTINCT grp.payee_id
FROM KFS.pdp_pmt_dtl_t pdt
INNER JOIN KFS.pdp_pmt_grp_t grp ON grp.pmt_grp_id = pdt.pmt_grp_id
INNER JOIN KFS.pdp_pmt_acct_dtl_t pad ON pad.pmt_dtl_id = pdt.pmt_dtl_id
WHERE pad.fin_object_cd BETWEEN '6500' AND '6593'
  AND pdt.fdoc_typ_cd LIKE 'DV%'
LIMIT 5;
*/
/*
SELECT
    grp.pmt_payee_nm AS payee_name,
    grp.payee_id,
    pdt.cust_pmt_doc_nbr,
    pad.fin_object_cd,
    pad.acct_net_amt,
    grp.disb_ts AS disbursement_timestamp,
    grp.disb_nbr,
    grp.pmt_stat_cd AS payment_status,
    pad.fin_coa_cd,
    pad.account_nbr
FROM
    KFS.pdp_pmt_dtl_t pdt
    INNER JOIN KFS.pdp_pmt_grp_t grp
        ON grp.pmt_grp_id = pdt.pmt_grp_id
    INNER JOIN KFS.pdp_pmt_acct_dtl_t pad
        ON pad.pmt_dtl_id = pdt.pmt_dtl_id
    INNER JOIN KFS.fp_dv_doc_t ddt2
        ON ddt2.fdoc_nbr = pdt.cust_pmt_doc_nbr
WHERE
    pad.fin_object_cd BETWEEN '6500' AND '6593'
    AND pdt.fdoc_typ_cd LIKE 'DV%'
    AND DATE(grp.disb_ts) = '2025-09-30'
    AND grp.pmt_payee_nm IN ('MACKENZIE, JESSICA A.', 'ALBITE-RUIZ, LEXIE')
ORDER BY grp.pmt_payee_nm, grp.disb_ts;
/*

/*
SELECT DISTINCT key_cd 
FROM KFS.krew_doc_hdr_ext_t 
WHERE key_cd LIKE '%uh%' 
   OR key_cd LIKE '%semester%' 
   OR key_cd LIKE '%payment%'
LIMIT 20;
*/
/*
SELECT * FROM fp_dv_doc_ext_t
LIMIT 20;

FDOC_NBR, OBJ_ID, VER_NBR, GOODS_SERVICES_RECV_DT, 
VNDR_OWNR_CD, VNDR_OWNR_CTGRY_CD, VISA_TYP_CD, EXMPT_CD, WITHHLD_RSN_CD, LAST_UPDT_DT
*/

/*
SELECT * FROM pur_vndr_hdr_t
WHERE vndr_us_tax_nbr IS NOT NULL
LIMIT 20;
*/

/*
TABLE: pur_vndr_hdr_t
ROW: vndr_us_tax_nbr
SELECT COUNT(*) AS stipend_rows
FROM kfsusr.pdp_pmt_acct_dtl_t pad
JOIN kfsusr.pdp_pmt_grp_t grp ON grp.pmt_grp_id = pad.pmt_grp_id
WHERE pad.fin_object_cd BETWEEN '6500' AND '6593'
AND grp.disb_ts BETWEEN STR_TO_DATE('01-10-2024','%d-%m-%Y')
*/