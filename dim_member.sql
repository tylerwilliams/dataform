-- 00000010_incr_load_dim_member.sql
-- UPDATE MEMBERSHIP STATUS

CREATE TEMPORARY TABLE dw_stg_incr_dim_member like dw.dim_member;

INSERT INTO dw_stg_incr_dim_member(member_id, created_date, created_datetime)
SELECT m.id, CONVERT_TIMEZONE('UTC', 'America/New_York', m.created_date)::DATE, CONVERT_TIMEZONE('UTC','America/New_York', m.created_date)
FROM	cmos.member m
WHERE	m.membership_status IN
	(
	'Trial',
	'Member',
	'Cancelled',
	'On Hold'
	);

UPDATE	dw_stg_incr_dim_member
SET		email_subscribed = CASE WHEN LOWER(mp.email_marketing_opt_in) = 'true'
                            AND mp.unsubscribed = 0
                            THEN 'subscribed'
                            ELSE 'unsubscribed'
                            END
FROM	public.customer_email_memberprofile mp
WHERE	dw_stg_incr_dim_member.member_id = mp.member_id;

UPDATE	dw_stg_incr_dim_member
SET
	sr_signup_landing_page = p.landing_page,
	signup_device = p.device
FROM	dw.fact_page_views p
WHERE	p.member_id = dw_stg_incr_dim_member.member_id
	AND p.event_date = dw_stg_incr_dim_member.created_date
	AND dw_stg_incr_dim_member.acquisition_source = 'website'
	AND p.page IN ('new_signup/amex/start_shopping', 'new_signup/gender')
;

-- Update Gender
UPDATE	dw_stg_incr_dim_member
SET		gender =
	CASE
		WHEN m.gender = 'M' THEN 'male'
		WHEN m.gender = 'F' THEN 'female'
	END
FROM	cmos.member_synergy_live m
WHERE	dw_stg_incr_dim_member.member_id = m.member_id
	AND m.gender IN ('F','M');

-- update cancellation date/ datetime
-- First update from cs_action_on member where data is available till 5/2015
UPDATE	dw_stg_incr_dim_member
SET
	cancel_datetime = x.cancel_date,
	cancel_date = x.cancel_date::DATE
FROM
	(
	SELECT	cs.member_id, MAX(CONVERT_TIMEZONE('UTC','America/New_York', cs.created_date)) AS cancel_date -- 97.55% have only one cancellation event
	FROM	cmos.cs_actions_on_member cs
 	WHERE	action_type = 'Cancel'
		AND CONVERT_TIMEZONE('UTC','America/New_York', cs.created_date) < CURRENT_DATE
	GROUP BY 1
	) x
WHERE	dw_stg_incr_dim_member.member_id = x.member_id;

-- Grab cancellations from Confirmations after 5/2015
UPDATE	dw_stg_incr_dim_member
SET
	cancel_datetime = x.cancel_date,
	cancel_date = x.cancel_date::DATE
FROM
	(
	SELECT	cs.member_id, MAX(CONVERT_TIMEZONE('UTC','America/New_York', cs.created_date)) AS cancel_date -- 97.55% have only one cancellation event
	FROM	cmos.confirmation cs
	WHERE	confirmation_type = 'CANCEL'
		AND CONVERT_TIMEZONE('UTC','America/New_York', cs.created_date) < CURRENT_DATE
	GROUP BY 1
	) x
WHERE	dw_stg_incr_dim_member.member_id = x.member_id;

-- Find members with referring retailer or a cross_sell = 0 order

UPDATE	dw_stg_incr_dim_member
SET
	acquisition_source = 'retailer',
	oltp_acquisition_campaign = x.acquisition_campaign,
	oltp_acquisition_misc = x.acquisition_misc,
	oltp_acquisition_content = x.acquisition_content,
	acquisition_retailer_id = x.referring_retailer,
	oltp_acquisition_term_membership = x.acquisition_term_membership,
	oltp_acquisition_partner = x.partner,
	acquisition_channel = x.acquisition_channel,
	acquisition_medium = x.acquisition_medium
FROM
	(
	SELECT	mt.*, ms.name AS acquisition_term_membership
	FROM
		(
		SELECT mc.member_id, mtb.min_term_begin_date, MIN(mc.created_date) AS min_created_date
		FROM   cmos.membership_term mc
			JOIN
			(
			SELECT member_id, MIN(term_begin_date) AS min_term_begin_date
			FROM   cmos.membership_term
			WHERE  term_begin_date IS NOT NULL
				AND term_begin_date NOT LIKE '0002%'
				AND referring_retailer IS NOT NULL -- Get only retailer records
				AND LOWER(referring_retailer) <> 'null'
			GROUP BY member_id
			) mtb ON mc.member_id = mtb.member_id AND mc.term_begin_date = mtb.min_term_begin_date
		WHERE	referring_retailer IS NOT NULL
			AND LOWER(referring_retailer) <> 'null'
		GROUP BY mc.member_id, mtb.min_term_begin_date
		) mtx
		JOIN cmos.membership_term mt ON mtx.member_id = mt.member_id AND mtx.min_term_begin_date = mt.term_begin_date AND mtx.min_created_date = mt.created_date
		JOIN cmos.membership ms ON mt.term_membership = ms.id
	WHERE	referring_retailer IS NOT NULL
		AND LOWER(referring_retailer) <> 'null'
	) x
WHERE	dw_stg_incr_dim_member.member_id = x.member_id;

UPDATE	dw_stg_incr_dim_member
SET
	acquisition_group=x.acquisition_group,
	sponsor = x.sponsor,
	sub_sponsor=x.sub_sponsor,
	recent_signup_date = x.recent_signup_date
FROM
	(
		SELECT
		mt.member_id,
		CASE WHEN LOWER(m.email) LIKE '%test%' THEN 'Exclude-Test'
			 WHEN LOWER(ACQUISITION_CAMPAIGN) LIKE '%membersave%' THEN 'Exclude-MemberSave'
			 WHEN LOWER(ACQUISITION_CAMPAIGN) LIKE '%cancelsave%' THEN 'Exclude-CancelSave'
		--	 WHEN cancel_datetime IS NOT NULL THEN 'Canceled'
			 WHEN (D.ACQUISITION_CHANNEL='emerging' OR (OLTP_ACQUISITION_CAMPAIGN='SLMDec2017' AND m.CREATED_DATE BETWEEN '2018-03-01' AND '2018-03-12' OR
			 (OLTP_ACQUISITION_CAMPAIGN='SLMDec2017' AND m.CREATED_DATE BETWEEN '2018-03-15' AND '2018-03-20'))) THEN 'Emerging'
			 WHEN d.acquisition_source='retailer' THEN 'PIK'
			 ELSE 'Channel'
			 END acquisition_group
		,CASE WHEN (D.ACQUISITION_CHANNEL='emerging' OR (OLTP_ACQUISITION_CAMPAIGN='SLMDec2017' AND mt.CREATED_DATE BETWEEN '2018-03-01' AND '2018-03-12' OR
			(OLTP_ACQUISITION_CAMPAIGN='SLMDec2017' AND m.CREATED_DATE BETWEEN '2018-03-15' AND '2018-03-20'))) THEN
				CASE
				WHEN (LOWER(ACQUISITION_CAMPAIGN) LIKE '%fb%' OR OLTP_ACQUISITION_CAMPAIGN='SLMDec2017' AND mt.CREATED_DATE BETWEEN '2018-03-01' AND '2018-03-12') THEN 'Facebook'
				WHEN ((OLTP_ACQUISITION_CAMPAIGN LIKE 'gg%' OR OLTP_ACQUISITION_CAMPAIGN LIKE 'gdn%') OR (OLTP_ACQUISITION_CAMPAIGN='SLMDec2017' AND m.CREATED_DATE BETWEEN '2018-03-15' AND '2018-03-20')) THEN 'Google'
				WHEN OLTP_ACQUISITION_CAMPAIGN LIKE 'yh%' THEN 'Yahoo'
				WHEN OLTP_ACQUISITION_CAMPAIGN LIKE 'bg%' THEN 'Bing'
				WHEN OLTP_ACQUISITION_CAMPAIGN LIKE 'dbm%' THEN 'Doubleclick'
				ELSE 'Other Emerging'
				END
		WHEN D.acquisition_source='retailer' THEN
					  CASE
					  WHEN LOWER(ACQUISITION_CAMPAIGN) LIKE '%spend and get%' OR LOWER(BEGIN_TERM_TYPE) LIKE '%spend and get%' OR LOWER(ACQUISITION_CAMPAIGN) LIKE '%spend_and_get%' OR LOWER(BEGIN_TERM_TYPE) LIKE '%spend_and_get%' THEN 'ShopRunner'
					  WHEN LOWER(ACQUISITION_CAMPAIGN) LIKE '%trial%' OR LOWER(BEGIN_TERM_TYPE) LIKE '%trial%' THEN 'ShopRunner'
				      WHEN LOWER(begin_term_type) LIKE '%amex%' OR LOWER(ACQUISITION_CAMPAIGN) LIKE '%amex%' OR lower(ACQUISITION_CAMPAIGN) LIKE '%americanexpress%' THEN 'Amex'
					  WHEN LOWER(BEGIN_TERM_TYPE) LIKE '%paypal%' OR LOWER(ACQUISITION_CAMPAIGN) LIKE '%paypal%' THEN 'Paypal'
					  WHEN LOWER(BEGIN_TERM_TYPE) LIKE '%mastercard%' OR LOWER(ACQUISITION_CAMPAIGN) LIKE '%mastercard%' THEN 'Mastercard'
					  ELSE 'Unknown' END
		WHEN LOWER(BEGIN_TERM_TYPE) LIKE '%amex%' OR LOWER(ACQUISITION_CAMPAIGN) LIKE '%amex%' OR LOWER(ACQUISITION_CAMPAIGN) LIKE '%americanexpress%' THEN 'Amex'
		WHEN LOWER(BEGIN_TERM_TYPE) LIKE '%paypal%' OR LOWER(ACQUISITION_CAMPAIGN) LIKE '%paypal%' THEN 'Paypal'
		WHEN LOWER(BEGIN_TERM_TYPE) LIKE '%mastercard%' OR LOWER(ACQUISITION_CAMPAIGN) LIKE '%mastercard%' THEN 'Mastercard'
		WHEN LOWER(BEGIN_TERM_TYPE) LIKE '%tmobile%' OR LOWER(ACQUISITION_CAMPAIGN) LIKE '%tmobile%' THEN 'T-Mobile'
		WHEN LOWER(ACQUISITION_CAMPAIGN) LIKE '%m2media%' THEN 'M2 Media'
		WHEN LOWER(ACQUISITION_CAMPAIGN) LIKE '%ups%' THEN 'UPS'
		WHEN LOWER(ACQUISITION_CAMPAIGN) LIKE '%redbox%' THEN 'Redbox'
		WHEN LOWER(ACQUISITION_CAMPAIGN) LIKE '%yahoo%' THEN 'Yahoo'
		WHEN LOWER(ACQUISITION_CAMPAIGN) LIKE '%verizon%' THEN 'Verizon'
		WHEN LOWER(ACQUISITION_CAMPAIGN) LIKE '%accessdevelopment%' OR LOWER(ACQUISITION_CAMPAIGN) LIKE '%accesschampion%' OR LOWER(ACQUISITION_CAMPAIGN) LIKE '%founderscardfeb2018%' THEN 'Borislow'
		when lower(acquisition_campaign) like '%ruelala_email_july2018%' then 'Ruelala'
		WHEN D.paid='paid' THEN 'Paid for Membership'
		ELSE 'Other Promotion' END sponsor
		,CASE WHEN (D.ACQUISITION_CHANNEL='emerging' OR (OLTP_ACQUISITION_CAMPAIGN='SLMDec2017' AND m.CREATED_DATE BETWEEN '2018-03-01' AND '2018-03-12' OR
		(OLTP_ACQUISITION_CAMPAIGN='SLMDec2017' AND m.CREATED_DATE BETWEEN '2018-03-15' AND '2018-03-20'))) THEN
			CASE
			WHEN OLTP_ACQUISITION_CAMPAIGN LIKE '%_nonbrand'	THEN 'NonBrand'
			WHEN OLTP_ACQUISITION_CAMPAIGN LIKE '%_brand' THEN 'Brand'
			WHEN OLTP_ACQUISITION_CAMPAIGN='SLMDec2017' AND mt.CREATED_DATE BETWEEN '2018-03-15' AND '2018-03-20'	THEN 'Brand'
			ELSE 'Nonbrand'
			END
		WHEN D.acquisition_source='retailer' AND LOWER(ACQUISITION_CAMPAIGN) LIKE '%spend and get%' OR LOWER(BEGIN_TERM_TYPE) LIKE '%spend and get%' OR LOWER(ACQUISITION_CAMPAIGN) LIKE '%spend_and_get%' OR LOWER(BEGIN_TERM_TYPE) LIKE '%spend_and_get%' THEN 'Spend and Get'
		WHEN  D.acquisition_source='retailer' AND LOWER(ACQUISITION_CAMPAIGN) LIKE '%trial%' OR LOWER(BEGIN_TERM_TYPE) LIKE '%trial%' THEN 'Trial'
		WHEN LOWER(begin_term_type) LIKE '%amex%' OR LOWER(ACQUISITION_CAMPAIGN) LIKE '%amex%' OR LOWER(ACQUISITION_CAMPAIGN) LIKE '%americanexpress%' THEN
			CASE WHEN (LOWER(acquisition_campaign) like '%oce%' OR ACQUISITION_MISC IN ('1click', '1clickLM') ) THEN 'OCE'
			WHEN (LOWER(ACQUISITION_CAMPAIGN) like '%trigger%' OR LOWER(ACQUISITION_MISC) LIKE '%trigger%' ) THEN 'Trigger'
			WHEN LOWER(ACQUISITION_CAMPAIGN) like '%enrollmentpulse%' THEN 'Enrollment Pulse'
			WHEN (LOWER(ACQUISITION_CAMPAIGN) like '%dsm' OR LOWER(ACQUISITION_MISC) LIKE '%dsm%') THEN 'DSM'
			WHEN (LOWER(ACQUISITION_CAMPAIGN) like '%landingpage' OR LOWER(ACQUISITION_MISC) LIKE 'lp') THEN 'Landing Page'
			WHEN (LOWER(mt.acquisition_source)='pik') THEN 'Amex PIK'
			ELSE 'Amex Other'
			END
		WHEN LOWER(BEGIN_TERM_TYPE) LIKE '%paypal%' OR LOWER(ACQUISITION_CAMPAIGN) LIKE '%paypal%' THEN
			CASE WHEN LOWER(ACQUISITION_CAMPAIGN) like '%_hv'  then 'High Value Email'
	         WHEN LOWER(ACQUISITION_CAMPAIGN) like '%fallfashion%' then 'Fall Fashion Email'
	         WHEN LOWER(ACQUISITION_CAMPAIGN) like '%genpop%' then 'General Population Email'
	         WHEN LOWER(ACQUISITION_CAMPAIGN)='pik' then 'Paypal PIK'
	         ELSE 'Paypal Other'
	         END
	    WHEN LOWER(BEGIN_TERM_TYPE) LIKE '%mastercard%' OR LOWER(ACQUISITION_CAMPAIGN) LIKE '%mastercard%'
	   	THEN OWNER_ICA_NAME
		ELSE 'Other'
		END sub_sponsor
		,md::DATE recent_signup_date
		FROM
			(
			SELECT
			MEMBER_ID
			,MAX(CREATED_DATE) md
			FROM
			cmos.MEMBERSHIP_TERM mt
			GROUP BY 1
			) md
		LEFT JOIN CMOS.MEMBERSHIP_TERM mt
		ON md.MEMBER_ID=mt.MEMBER_ID
		AND md.MD=mt.CREATED_DATE
		LEFT JOIN  DW.DIM_MEMBER D ON mt.MEMBER_id=D.MEMBER_ID
		LEFT JOIN cmos.MEMBER m
		ON m.ID=mt.MEMBER_ID
		LEFT JOIN
		(
		select LEFT(a.account_range_from,6) as bin_range_from,
		LEFT(a.through,6) as bin_range_through,
		max(TRIM(a.owner_ica_name)) as owner_ica_name,
		max(TRIM(a.issuing_country)) as issuing_country
		from reports.mastercard_issuer_account_ranges a
		GROUP BY 1,2
		order by 1,2,3,4
		) MC
		ON mt.ACQUISITION_CONTENT BETWEEN mc.bin_range_from AND mc.bin_range_through
		GROUP BY 1,2,3,4,5
	) x
WHERE	dw_stg_incr_dim_member.member_id = x.member_id;

UPDATE	dw_stg_incr_dim_member
SET
	acquisition_source = 'retailer',
	acquisition_retailer_id = o.retailer_id
FROM	cmos.cmos_order o
WHERE	dw_stg_incr_dim_member.member_id = o.member_id
	AND dw_stg_incr_dim_member.acquisition_retailer_id IS NULL
	AND o.is_cross_sell = 0;

-- Rest are non-retailer members. Use first acquisition record to assign the source, etc.

UPDATE	dw_stg_incr_dim_member
SET
	acquisition_source =
		case when x.acquisition_source = 'mobile' and x.term_begin_date >= '2015-11-11'
			then 'mobile'
			else 'website'
			end
	,
	oltp_acquisition_campaign = x.acquisition_campaign,
	oltp_acquisition_misc = x.acquisition_misc,
	oltp_acquisition_content = x.acquisition_content,
	oltp_acquisition_term_membership = x.acquisition_term_membership,
	oltp_acquisition_partner = x.partner,
	acquisition_channel = x.acquisition_channel,
	acquisition_medium = x.acquisition_medium
FROM
	(
	SELECT	mt.*, ms.name AS acquisition_term_membership
	FROM
		(
		SELECT mc.member_id, mtb.min_term_begin_date, MIN(mc.created_date) AS min_created_date
		FROM   cmos.membership_term mc
			JOIN
			(
			SELECT member_id, MIN(term_begin_date) AS min_term_begin_date
			FROM   cmos.membership_term
			WHERE  term_begin_date IS NOT NULL
				AND term_begin_date NOT LIKE '0002%'
			GROUP BY member_id
			) mtb ON mc.member_id = mtb.member_id AND mc.term_begin_date = mtb.min_term_begin_date
		GROUP BY mc.member_id, mtb.min_term_begin_date
		) mtx
		JOIN cmos.membership_term mt ON mtx.member_id = mt.member_id AND mtx.min_term_begin_date = mt.term_begin_date AND mtx.min_created_date = mt.created_date
		JOIN cmos.membership ms ON mt.term_membership = ms.id
	) x
WHERE	dw_stg_incr_dim_member.member_id = x.member_id
	AND dw_stg_incr_dim_member.acquisition_source IS NULL;

UPDATE	dw_stg_incr_dim_member
SET		paid = 'paid'
FROM
	(
	SELECT	DISTINCT p.member_id
	FROM	cmos.transaction p
      JOIN cmos.transaction_type tt on
      tt.id = p.transaction_type
		LEFT JOIN
		(
		SELECT	original_invoice_id, t.created_date AS cancellation_date, transaction_type
		FROM	cmos.transaction t
        JOIN cmos.transaction_type ttype
        on ttype.id = t.transaction_type
		WHERE	ttype.type IN ('Member Refund')
			AND t.transaction_status IN ('Processed', 'Success', 'Pending')
		) c ON p.id = c.original_invoice_id
	WHERE	tt.type IN ('Membership Fee', 'Renewal Fee')
		AND p.transaction_status IN ('Success','Processed', 'Pending')
		AND c.original_invoice_id IS NULL
	) pm
WHERE	dw_stg_incr_dim_member.member_id = pm.member_id;

UPDATE	dw_stg_incr_dim_member
SET
	current_member_status =
		CASE
			WHEN x.name = 'Member Save' THEN 'Member Save'
			WHEN x.membership_status IN ('Trial', 'Member') THEN 'Active'
			WHEN x.membership_status IN ('On Hold') THEN 'On Hold'
			ELSE 'Cancelled'
		END, -- Account for new, failed signup, paypal pending
	oltp_current_member_status = x.membership_status,
	oltp_current_term_membership = x.name,
	oltp_current_partner = x.partner
FROM
	(
	SELECT	m.id, m.membership_status, ms.name, mt.partner
	FROM	cmos.member m
		JOIN cmos.membership_term mt ON m.current_membership_term_id = mt.id
		JOIN cmos.membership ms ON mt.term_membership = ms.id
	) x
WHERE	dw_stg_incr_dim_member.member_id = x.id;


/* For date before 2014-01-01 */
UPDATE  dw_stg_incr_dim_member
SET
        acquisition_member_type =
        CASE
                WHEN oltp_acquisition_partner IN ('AmexBenefit', 'Amex', 'Amex - Inactive') THEN 'AMEX'
                WHEN oltp_acquisition_term_membership IN ('Standard Membership', 'Monthly Membership', 'Free Trial Membership') OR (acquisition_source = 'retailer' AND NVL(oltp_acquisition_campaign, '') IN ('', 'MemberSave'))
THEN 'Trial'
       				  ELSE 'Promo'
        END,
        current_member_type =
        CASE
                WHEN oltp_current_partner IN ('AmexBenefit', 'Amex', 'Amex - Inactive') THEN 'AMEX'
                WHEN oltp_current_term_membership = 'Free Trial Membership' THEN 'Trial'
                WHEN oltp_current_term_membership IN ('Standard Membership', 'Monthly Membership') THEN 'Paid'
                ELSE 'Promo'
        END
WHERE created_date < '2014-01-01';

/* For date after 2014-01-01 */
UPDATE	dw_stg_incr_dim_member
SET
	acquisition_member_type =
	CASE
		WHEN oltp_acquisition_partner IN ('AmexBenefit', 'Amex', 'Amex - Inactive') THEN 'AMEX'
		WHEN oltp_acquisition_term_membership IN ('Standard Membership', 'Monthly Membership','20 dollars membership','30 dollars membership','Paid 49') THEN 'Paid'
		WHEN oltp_acquisition_term_membership IN ('Free Trial Membership') OR (acquisition_source = 'retailer' AND NVL(oltp_acquisition_partner, '') IN ('', 'NULL')) THEN 'Trial'
		ELSE 'Promo'
	END,
	current_member_type =
	CASE
		WHEN oltp_current_partner IN ('AmexBenefit', 'Amex', 'Amex - Inactive') THEN 'AMEX'
		WHEN oltp_current_term_membership = 'Free Trial Membership' THEN 'Trial'
		WHEN oltp_current_term_membership IN ('Standard Membership', 'Monthly Membership','20 dollars membership','30 dollars membership','Paid 49') THEN 'Paid'
		ELSE 'Promo'
	END
WHERE created_date >= '2014-01-01';


UPDATE	dw_stg_incr_dim_member
SET	acquisition_retailer_name = r.retailer_name
FROM	cmos.retailer r
WHERE	dw_stg_incr_dim_member.acquisition_retailer_id = r.id;

UPDATE	dw_stg_incr_dim_member
SET		acquisition_source = 'website'
WHERE	acquisition_source IS NULL;

--UPDATE	dw_stg_incr_dim_member
--SET		amex_start_date = x.amex_start_date
--FROM
--	(
--	SELECT
--		m.id AS member_id,
--		MIN(CONVERT_TIMEZONE('America/New_York', mt.created_date)::DATE) AS amex_start_date
--	FROM	cmos.member m
--		JOIN cmos.membership_term mt ON m.id = mt.member_id
--	WHERE CONVERT_TIMEZONE('America/New_York', mt.created_date)::DATE >= '2013-05-15'
--		AND mt.partner IN ('AmexBenefit', 'Amex', 'Amex - Inactive')
--		AND mt.acquisition_campaign <> 'Household'
--	GROUP BY m.id
--	) x
--WHERE	dw_stg_incr_dim_member.member_id = x.member_id;

UPDATE	dw_stg_incr_dim_member
SET		segment = s.segment
FROM	cmos.member_segment_v2 s
WHERE	s.member_id = dw_stg_incr_dim_member.member_id
	AND tagged_out IS NULL;

UPDATE	dw_stg_incr_dim_member
SET
	pik_flow_experiment = p.experiment,
	pik_flow_first_referrer = p.first_referrer,
	signup_device = p.device
FROM	dw.fact_pik_signup_flow p
WHERE	p.page IN ('rpik_std_signup_success', 'rpik_amex_signup_success', 'rpik_pik_personalize')
	AND p.member_id = dw_stg_incr_dim_member.member_id
;

--Added by Parul
UPDATE	dw_stg_incr_dim_member
SET
	activating_retailer_id = o.retailer_id,
	activating_retailer_name = r.retailer_name
FROM	dw.fact_orders o join dw.dim_retailer r on o.retailer_id = r.retailer_id
WHERE o.member_id = dw_stg_incr_dim_member.member_id and o.member_lifetime_order_number = 1
;
-- Load

DELETE
FROM	dw.dim_member
WHERE	member_id NOT IN (SELECT member_id FROM dw_stg_incr_dim_member);

UPDATE	dw.dim_member
SET
	created_date = t.created_date,
	cancel_date = t.cancel_date,
	created_datetime = t.created_datetime,
	cancel_datetime = t.cancel_datetime,
	gender = t.gender,
	acquisition_source = t.acquisition_source,
	acquisition_member_type = t.acquisition_member_type,
	acquisition_retailer_id = t.acquisition_retailer_id,
	acquisition_retailer_name = t.acquisition_retailer_name,
	current_member_status = t.current_member_status,
	current_member_type = t.current_member_type,
	email_subscribed = t.email_subscribed,
	paid = t.paid,
	oltp_acquisition_campaign = t.oltp_acquisition_campaign,
	oltp_acquisition_misc = t.oltp_acquisition_misc,
	oltp_acquisition_content = t.oltp_acquisition_content,
	oltp_acquisition_partner = t.oltp_acquisition_partner,
	oltp_acquisition_term_membership = t.oltp_acquisition_term_membership,
	oltp_current_member_status = t.oltp_current_member_status,
	oltp_current_term_membership = t.oltp_current_term_membership,
	oltp_current_partner = t.oltp_current_partner,
	segment = t.segment,
	pik_flow_experiment = t.pik_flow_experiment,
	pik_flow_first_referrer = t.pik_flow_first_referrer,
	modified_datetime = CURRENT_TIMESTAMP()::TIMESTAMP,
	acquisition_channel = t.acquisition_channel,
	acquisition_medium = t.acquisition_medium,
	sr_signup_landing_page = t.sr_signup_landing_page,
	activating_retailer_id = t.activating_retailer_id,
	activating_retailer_name = t.activating_retailer_name,
	signup_device = t.signup_device,
	acquisition_group=t.acquisition_group,
	sponsor=t.sponsor,
	sub_sponsor=t.sub_sponsor,
	recent_signup_date=t.recent_signup_date
FROM	dw_stg_incr_dim_member t
WHERE	t.member_id = dw.dim_member.member_id
	AND t.member_id IN
	(
	SELECT	m.member_id
	FROM	dw_stg_incr_dim_member t
		JOIN dw.dim_member m ON t.member_id = m.member_id
	WHERE
		(
		NVL(m.created_date, '1900-01-01') <> NVL(t.created_date, '1900-01-01') OR
		NVL(m.cancel_date, '1900-01-01') <> NVL(t.cancel_date, '1900-01-01') OR
		NVL(m.created_datetime, '1900-01-01') <> NVL(t.created_datetime, '1900-01-01') OR
		NVL(m.cancel_datetime, '1900-01-01') <> NVL(t.cancel_datetime, '1900-01-01') OR
		NVL(m.gender, '') <> NVL(t.gender, '') OR
		NVL(m.acquisition_source, '') <> NVL(t.acquisition_source, '') OR
		NVL(m.acquisition_member_type, '') <> NVL(t.acquisition_member_type, '') OR
		NVL(m.acquisition_retailer_id, '') <> NVL(t.acquisition_retailer_id, '') OR
		NVL(m.acquisition_retailer_name, '') <> NVL(t.acquisition_retailer_name, '') OR
		NVL(m.current_member_status, '') <> NVL(t.current_member_status, '') OR
		NVL(m.current_member_type, '') <> NVL(t.current_member_type, '') OR
		NVL(m.email_subscribed, '') <> NVL(t.email_subscribed, '') OR
		NVL(m.paid, '') <> NVL(t.paid, '') OR
		NVL(m.oltp_acquisition_campaign, '') <> NVL(t.oltp_acquisition_campaign, '') OR
		NVL(m.oltp_acquisition_misc, '') <> NVL(t.oltp_acquisition_misc, '') OR
		NVL(m.oltp_acquisition_content, '') <> NVL(t.oltp_acquisition_content, '') OR
		NVL(m.oltp_acquisition_partner, '') <> NVL(t.oltp_acquisition_partner, '') OR
		NVL(m.oltp_acquisition_term_membership, '') <> NVL(t.oltp_acquisition_term_membership, '') OR
		NVL(m.oltp_current_member_status, '') <> NVL(t.oltp_current_member_status, '') OR
		NVL(m.oltp_current_term_membership, '') <> NVL(t.oltp_current_term_membership, '') OR
		NVL(m.oltp_current_partner, '') <> NVL(t.oltp_current_partner, '') OR
		NVL(m.segment, '') <> NVL(t.segment, '') OR
		NVL(m.pik_flow_experiment, '') <> NVL(t.pik_flow_experiment, '') OR
		NVL(m.pik_flow_first_referrer, '') <> NVL(t.pik_flow_first_referrer, '') OR
		NVL(m.acquisition_channel, '') <> NVL(t.acquisition_channel, '') OR
		NVL(m.acquisition_medium, '') <> NVL(t.acquisition_medium, '') OR
		NVL(m.activating_retailer_id, '') <> NVL(t.activating_retailer_id, '') OR
		NVL(m.activating_retailer_name, '') <> NVL(t.activating_retailer_name, '')  OR
		NVL(m.signup_device, '') <> NVL(t.signup_device, '') OR
		NVL(m.acquisition_group, '') <> NVL(t.acquisition_group, '') OR
		NVL(m.sponsor, '') <> NVL(t.sponsor, '') OR
		NVL(m.sub_sponsor, '') <> NVL(t.sub_sponsor, '') OR
		NVL(m.recent_signup_date, '1900-01-01') <> NVL(t.recent_signup_date, '1900-01-01')
		)
	)
	;

INSERT INTO dw.dim_member
	(
	member_id,
	created_date,
	cancel_date,
	created_datetime,
	cancel_datetime,
	gender,
	acquisition_source,
	acquisition_member_type,
	acquisition_retailer_id,
	acquisition_retailer_name,
	current_member_status,
	current_member_type,
	email_subscribed,
	paid,
	oltp_acquisition_campaign,
	oltp_acquisition_misc,
	oltp_acquisition_content,
	oltp_acquisition_partner,
	oltp_acquisition_term_membership,
	oltp_current_member_status,
	oltp_current_term_membership,
	oltp_current_partner,
	segment,
	pik_flow_experiment,
	pik_flow_first_referrer,
	modified_datetime,
	acquisition_channel,
	acquisition_medium,
	sr_signup_landing_page,
	activating_retailer_id,
	activating_retailer_name,
	signup_device,
	acquisition_group,
	sponsor,
	sub_sponsor,
	recent_signup_date
	)
SELECT
	member_id,
	created_date,
	cancel_date,
	created_datetime,
	cancel_datetime,
	gender,
	acquisition_source,
	acquisition_member_type,
	acquisition_retailer_id,
	acquisition_retailer_name,
	current_member_status,
	current_member_type,
	email_subscribed,
	paid,
	oltp_acquisition_campaign,
	oltp_acquisition_misc,
	oltp_acquisition_content,
	oltp_acquisition_partner,
	oltp_acquisition_term_membership,
	oltp_current_member_status,
	oltp_current_term_membership,
	oltp_current_partner,
	segment,
	pik_flow_experiment,
	pik_flow_first_referrer,
	CURRENT_TIMESTAMP()::TIMESTAMP,
	acquisition_channel,
	acquisition_medium,
	sr_signup_landing_page,
	activating_retailer_id,
	activating_retailer_name,
	signup_device,
	acquisition_group,
	sponsor,
	sub_sponsor,
	recent_signup_date
FROM	dw_stg_incr_dim_member
WHERE	member_id NOT IN (SELECT member_id FROM dw.dim_member);

--Alter TABLE dw.dim_member
--ADD first_mobile_event_date datetime;
--
--
--Alter TABLE dw.dim_member
--ADD first_mobile_checkout_date datetime;
--

UPDATE dw.dim_member m
SET  m.first_mobile_event_date = x.first_mobile_event_date
from  (
		select
		member_id,
		min(event_date) first_mobile_event_date
		from dw.fact_mobile_events
		group by 1) x
where m.member_id = x.member_id;


UPDATE dw.dim_member m
SET m.first_mobile_checkout_date = x.first_mobile_checkout_date
from   (
		select
		member_id,
		cast (min(create_time) as date) first_mobile_checkout_date
		from dw.fact_mobile_purchaserequest
		group by 1) x
where m.member_id = x.member_id;


UPDATE dw.dim_member
SET first_mobile_event_date = m.first_mobile_checkout_date
from dw.dim_member m
where m.first_mobile_checkout_date is not null and m.first_mobile_event_date is null;


update dw.dim_member
set mobile_app_install_acquisition_channel = md.channel,
mobile_app_install_acquisition_campaign = md.campaign,
mobile_app_install_acquisition_marketing_title = md.marketing_title
from dw.dim_member m
inner join dw.dim_mobile_device md
on m.member_id = md.member_id
where md.campaign is not null;


update dw.dim_member m
	set m.r_value = r.rvalue
from  cmos.member_rvalues r
where m.member_id = r.member_id;




update dw.dim_member m
set m.email_open_first_7_days = true
from dw.fact_email_opens e
where  m.member_id = e.member_id
and datediff (DAY, m.created_date, e.open_date) < 7
and datediff (DAY, m.created_date, e.open_date) > 0;


update dw.dim_member m
set m.email_open_first_30_days = true
from dw.fact_email_opens e
where m.member_id = e.member_id
and datediff (DAY, m.created_date, e.open_date) < 30
and datediff (DAY, m.created_date, e.open_date) > 0;


update dw.dim_member m
set email_click_first_7_days = true
from dw.fact_email_clicks e
where m.member_id = e.member_id
and datediff (DAY, m.created_date, e.click_date) < 7
and datediff (DAY, m.created_date, e.click_date) > 0;


update dw.dim_member m
set m.email_click_first_30_days = true
from dw.fact_email_clicks e
where m.member_id = e.member_id
and datediff (DAY, m.created_date, e.click_date) < 30
and datediff (DAY, m.created_date, e.click_date) > 0;


update dw.dim_member m
set m.app_open_first_7_days = true
from dw.fact_mobile_events e
where m.member_id = e.member_id
and datediff (DAY, m.created_date, e.event_date) < 7
and datediff (DAY, m.created_date, e.event_date) > 0;


update dw.dim_member m
set m.app_open_first_30_days = true
from dw.fact_mobile_events e
where m.member_id = e.member_id
and datediff (DAY, m.created_date, e.event_date) < 30
and datediff (DAY, m.created_date, e.event_date) > 0;


update dw.dim_member m
set m.sr_com_visit_first_7_days = true
from dw.fact_page_views e
where m.member_id = e.member_id
and datediff (DAY, m.created_date, e.event_date) < 7
and datediff (DAY, m.created_date, e.event_date) > 0;

update dw.dim_member m
set m.sr_com_visit_first_30_days = true
from  dw.fact_page_views e
where m.member_id = e.member_id
and datediff (DAY, m.created_date, e.event_date) < 30
and datediff (DAY, m.created_date, e.event_date) > 0;



update dw.dim_member m
set m.first_retailer_visit_first_7_days = true
from  dw.fact_retailer_visits e
where m.member_id = e.member_id
and datediff (DAY, m.created_date, e.visit_date) < 7
and datediff (DAY, m.created_date, e.visit_date) > 0;

update dw.dim_member m
set m.first_retailer_visit_first_30_days = true
from  dw.fact_retailer_visits e
where m.member_id = e.member_id
and datediff (DAY, m.created_date, e.visit_date) < 30
and datediff (DAY, m.created_date, e.visit_date) > 0;

update dw.dim_member m
set m.first_visit_retailer = v.retailer_id
from dw.fact_retailer_visits v
inner join (
		select member_id, min(visit_datetime) min_visit_datetime
		from dw.fact_retailer_visits
		group by 1) x
	on v.member_id = x.member_id
	and v.visit_datetime = x.min_visit_datetime
where  m.member_id = v.member_id;

update dw.dim_member m
set m.additional_retailer_visit_first_7_days = true
from dw.fact_retailer_visits e
where m.member_id = e.member_id
and datediff (DAY, m.created_date, e.visit_date) < 7
and m.first_visit_retailer != e.retailer_id
and datediff (DAY, m.created_date, e.visit_date) > 0;


update dw.dim_member m
set m.additional_retailer_visit_first_7_days = true
from  dw.fact_retailer_visits e
where m.member_id = e.member_id
and datediff (DAY, m.created_date, e.visit_date) < 7
and m.first_visit_retailer != e.retailer_id
and datediff (DAY, m.created_date, e.visit_date) > 0;


update dw.dim_member m
set m.additional_retailer_visit_first_30_days = true
from dw.fact_retailer_visits e
where m.member_id = e.member_id
and datediff (DAY, m.created_date, e.visit_date) < 30
and m.first_visit_retailer != e.retailer_id
and datediff (DAY, m.created_date, e.visit_date) > 0;

update dw.dim_member m
set m.order_first_7_days = true
from  dw.fact_orders e
where m.member_id = e.member_id
and datediff (DAY, m.created_date, e.order_date) < 7
and datediff (DAY, m.created_date, e.order_date) > 0;


update dw.dim_member m
set m.order_first_30_days = true
from  dw.fact_orders e
where m.member_id = e.member_id
and datediff (DAY, m.created_date, e.order_date) < 30
and datediff (DAY, m.created_date, e.order_date) > 0;


update dw.dim_member
set email_open_first_7_days = false
where email_open_first_7_days  is null;

update dw.dim_member
set email_open_first_30_days = false
where email_open_first_30_days is null;

update dw.dim_member
set email_click_first_7_days = false
where email_click_first_7_days  is null;

update dw.dim_member
set email_click_first_30_days = false
where email_click_first_30_days  is null;

update dw.dim_member
set app_open_first_7_days  = false
where app_open_first_7_days   is null;

update dw.dim_member
set app_open_first_30_days  = false
where app_open_first_30_days  is null;

update dw.dim_member
set sr_com_visit_first_7_days = false
where sr_com_visit_first_7_days  is null;

update dw.dim_member
set sr_com_visit_first_30_days = false
where sr_com_visit_first_30_days  is null;

update dw.dim_member
set first_retailer_visit_first_7_days = false
where first_retailer_visit_first_7_days  is null;

update dw.dim_member
set first_retailer_visit_first_30_days = false
where first_retailer_visit_first_30_days  is null;

update dw.dim_member
set additional_retailer_visit_first_7_days = false
where additional_retailer_visit_first_7_days  is null;

update dw.dim_member
set additional_retailer_visit_first_30_days = false
where additional_retailer_visit_first_30_days  is null;

update dw.dim_member
set order_first_7_days = false
where order_first_7_days  is null;



update dw.dim_member
set order_first_30_days = false
where order_first_30_days  is null;

UPDATE dw.dim_member m
SET m.member_email=pm.email
from cmos.member pm
where m.member_id=pm.id
and m.member_email is null;


update dw.dim_member m
set m.last_order_retailer = y.retailer_name
from  (
select distinct o.member_id, r.retailer_name
	from dw.fact_orders o
	inner join dw.dim_retailer r
	on o.retailer_id = r.retailer_id
	inner join
		(
		select o.member_id, max (o.order_datetime) as last_order_time
		from dw.fact_orders o
		group by 1
		) x
	on	x.member_id = o.member_id
	and x.last_order_time = o.order_datetime
	) y
where y.member_id = m.member_id;


update dw.dim_member
set
amex_acquisition_initiative =
	case
when acquisition_member_type != 'AMEX' then 'Non-AMEX'
when acquisition_source = 'retailer' then 'Retailer'
when acquisition_medium = 'dsm' then 'DSM'
when acquisition_medium = 'web' and oltp_acquisition_misc  like 'RAF%' then 'RAF'
when acquisition_medium = 'site' and oltp_acquisition_misc  like 'lp%' then 'LP'
when oltp_acquisition_misc   like 'NULL%' then 'Organic/Other'
when oltp_acquisition_misc like 'NovCSbenefit%' then 'Organic/Other'
when oltp_acquisition_misc like 'RAF%' then 'Organic/Other'
when oltp_acquisition_misc like 'augnewsletter%' then 'Organic/Other'
when oltp_acquisition_misc like 'ded1%' then 'Organic/Other'
when oltp_acquisition_misc like 'cam200%' then 'Organic/Other'
when oltp_acquisition_misc like 'holidaydisplay%' then 'Organic/Other'
when oltp_acquisition_misc like 'holidayhomepage%' then 'Organic/Other'
when oltp_acquisition_misc like 'taftop_email_20141215%' then 'Organic/Other'
when oltp_acquisition_misc like 'fb200%' then 'Organic/Other'
when oltp_acquisition_misc like '11000_168036_0%' then 'Organic/Other'
when oltp_acquisition_misc like 'octnewsletter%' then 'Organic/Other'
when oltp_acquisition_misc like '2016_feb_amex_enrollment_pulse_twitter%' then 'Organic/Other'
when oltp_acquisition_misc like '2016_feb_amex_enrollment_pulse_atl_display_media2%' then 'Organic/Other'
when oltp_acquisition_misc like '2016_feb_amex_enrollment_pulse_atl_display_media%' then 'Organic/Other'
when oltp_acquisition_misc like 'f47D3D3janoD1D2D1%' then 'Organic/Other'
when oltp_acquisition_misc like 'f47D2Do45uD1D2%' then 'Organic/Other'
when oltp_acquisition_misc like '1click%' then 'Pulse'
when oltp_acquisition_misc like '2016_feb_amex_enrollment_email3%' then 'Pulse'
when oltp_acquisition_misc like '2016_feb_amex_enrollment_email2%' then 'Pulse'
when oltp_acquisition_misc like '2016_feb_amex_enrollment_email1%' then 'Pulse'
when oltp_acquisition_misc like '1clickLM%' then 'Pulse'
when oltp_acquisition_misc like '1clickLMNov%' then 'Pulse'
when oltp_acquisition_misc like 'trigger5%' then 'Trigger'
when oltp_acquisition_misc like 'trigger4%' then 'Trigger'
when oltp_acquisition_misc like '2016_june_amex_trigger1%' then 'Trigger'
when oltp_acquisition_misc like '2016_feb_amex_trigger4%' then 'Trigger'
when oltp_acquisition_misc like 'trigger1%' then 'Trigger'
when oltp_acquisition_misc like '2016_june_amex_trigger2%' then 'Trigger'
when oltp_acquisition_misc like 'trigger3%' then 'Trigger'
when oltp_acquisition_misc like 'trigger2%' then 'Trigger'
when oltp_acquisition_misc like '2016_feb_amex_trigger3%' then 'Trigger'
when oltp_acquisition_misc like '2016_oct_amex_trigger%' then 'Trigger'
when oltp_acquisition_misc like '2016_feb_amex_trigger1%' then 'Trigger'
when oltp_acquisition_misc like 'trigger6%' then 'Trigger'
when oltp_acquisition_misc like '2016_june_amex_trigger3%' then 'Trigger'
when oltp_acquisition_misc like 'trigger1A%' then 'Trigger'
when oltp_acquisition_misc like 'trigger4A%' then 'Trigger'
when oltp_acquisition_misc like 'trigger3A%' then 'Trigger'
when oltp_acquisition_misc like 'trigger2A%' then 'Trigger'
when oltp_acquisition_misc like '2016_feb_amex_trigger2%' then 'Trigger'
when oltp_acquisition_misc like '2016_feb_amex_enrollment_pulse_amex_com_dsm' then 'DSM'
when oltp_acquisition_misc like '2016_feb_amex_enrollment_pulse_amex_com_display' then 'Display'
when oltp_acquisition_misc like '2016_feb_amex_enrollment_pulse_atl_display_media' then 'Display'
when oltp_acquisition_misc like '2016_feb_amex_enrollment_pulse_atl_display_media2' then 'Display'
when oltp_acquisition_misc like '2016_feb_amex_enrollment_pulse_facebook' then 'Display'
when oltp_acquisition_misc like '2016_feb_amex_enrollment_pulse_amex_com_display' then 'Display'
when oltp_acquisition_misc like '2016_oct_amex_enrollment_email_gen_pop' then 'Trigger'
when oltp_acquisition_misc like '2016_oct_amex_enrollment_email_best_customer' then 'Trigger'
when oltp_acquisition_misc like '2016_oct_amex_enrollment_dsm_gen_pop' then 'DSM'
when oltp_acquisition_misc like '2016_oct_amex_enrollment_dsm_best_customer' then 'DSM'
when oltp_acquisition_misc like '2016_oct_amex_enrollment_display_banner_gen_pop' then 'Display'
when oltp_acquisition_misc like '2016_oct_amex_enrollment_display_banner_gen_pop' then 'Display'
when oltp_acquisition_misc like '2016_oct_amex_enrollment_social_organic' then 'Social'
when oltp_acquisition_misc like '2016_oct_amex_enrollment_social_facebook_paid_only' then 'Organic/Other'
else 'Organic/Other'
end;


update dw.dim_member m
set
m.signup_external_referer_domain = y.external_referer_domain,
m.signup_external_referer_url = y.external_referer_url,
m.signup_landing_page = y.landing_page,
m.signup_landing_page_url = y.landing_page_url
from
(
	select
	distinct
	pv.member_id,
	external_referer_domain,
	external_referer_url,
	landing_page,
	landing_page_url
	from dw.fact_page_views pv
	inner join
	(
		select
		pv.member_id,
		event_date,
		min(event_datetime) as event_datetime
		from dw.fact_page_views pv
		inner join dw.dim_member m
		on pv.member_id = m.member_id
		and m.created_date = pv.event_date
		group by 1,2
	) x
	on pv.member_id = x.member_id
	and pv.event_datetime = pv.event_datetime
) y
where m.member_id = y.member_id
and m.acquisition_source = 'website';

DROP  TABLE dw_stg_incr_dim_member;
