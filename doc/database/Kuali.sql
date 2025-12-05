SELECT COUNT(*) AS stipend_rows
FROM kfsusr.pdp_pmt_acct_dtl_t pad
JOIN kfsusr.pdp_pmt_grp_t grp ON grp.pmt_grp_id = pad.pmt_grp_id
WHERE pad.fin_object_cd BETWEEN '6500' AND '6593'
  AND grp.disb_ts BETWEEN STR_TO_DATE('01-10-2024','%d-%m-%Y')
                      AND STR_TO_DATE('15-11-2024','%d-%m-%Y');


#SELECT * FROM pdp_pmt_dtl_t;
#SELECT payee_id, pmt_payee_nm FROM pdp_pmt_grp_t;
#SELECT vndr_us_tax_nbr FROM pur_vndr_hdr_t; #Found but lots of nulls

-- pdp_pmt_acct_dtl_t
#SELECT acct_net_amt, fin_coa_cd, account_nbr, fin_object_cd  FROM pdp_pmt_acct_dtl_t;

-- pdp_pmt_grp_t
#SELECT disb_ts, disb_nbr, pmt_stat_cd FROM pdp_pmt_grp_t;

-- fp_dv_doc_t
#SELECT dv_chk_stub_txt FROM fp_dv_doc_t;

-- krns_doc_hdr_t
#SELECT explanation FROM krns_doc_hdr_t; REMOVED

-- fp_dv_doc_ext_t
#SELECT uh_id_number FROM fp_dv_doc_ext_t;
#SELECT semester_term FROM fp_dv_doc_ext_t;
#SELECT type_of_payment_selection FROM fp_dv_doc_ext_t;
#SELECT * FROM fp_dv_doc_ext_t;

/*

pdp_pmt_acct_dtl_t	acct_net_amt
pdp_pmt_grp_t	disb_ts
pdp_pmt_grp_t	disb_nbr
pdp_pmt_grp_t	pmt_stat_cd
fp_dv_doc_t	dv_chk_stub_txt
krns_doc_hdr_t	explanation
pdp_pmt_acct_dtl_t	fin_coa_cd
pdp_pmt_acct_dtl_t	account_nbr
pdp_pmt_acct_dtl_t	fin_object_cd
fp_dv_doc_ext_t	uh_id_number
fp_dv_doc_ext_t	semester_term
fp_dv_doc_ext_t	type_of_payment_selection
derived from krew_actn_tkn_t / krew_actn_rqst_t / krim_prncpl_t	p_uid (approver principal name)
*/

#PARAMETERS
#SELECT * FROM krcr_parm_t;
#NMSPC_CD, CMPNT_CD, PARM_NM, OBJ_ID, VER_NBR, PARM_TYP_CD, VAL, PARM_DESC_TXT, EVAL_OPRTR_CD

/*
SELECT VENDOR_HDR_GNRTD_ID,
       VNDR_US_TAX_NBR,
       VNDR_FEIN_NBR,
       VNDR_TAX_TYP_CD
FROM PUR_VNDR_HDR_T
WHERE VNDR_US_TAX_NBR IS NOT NULL
LIMIT 5;
*/
/*
SELECT PARM_NM, VAL
FROM KRCR_PARM_T
WHERE NMSPC_CD = 'KFS-GL'
  AND CMPNT_CD = 'Batch'
  AND PARM_NM LIKE 'STIPEND_PAYMENT_EXTRACT_JOB_%';
  /*
/*
SELECT *
FROM kfsusr.KRCR_PARM_T
WHERE NMSPC_CD = 'KFS-GL'
  AND CMPNT_CD = 'Batch'
  AND PARM_NM LIKE 'STIPEND_PAYMENT_EXTRACT_JOB_%'
LIMIT 50;
*/