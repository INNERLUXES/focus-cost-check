# Rules and sources

Every column name, allowed value and sentence that the checks rely on comes from a page of the FinOps Open Cost and Usage Specification (FOCUS) or from the documentation of a cloud that says it exports FOCUS, saved in this repository. The first line of each saved file is the address of the page, and `test/data.test.js` compares every sentence in `src/data.js` with the saved text, word for word, so a sentence cannot be changed without the page, and a sentence that is not on a saved page is not a fact of the tool.

The pages of the specification are saved from the markdown of a released version (the address names the version), as text: the links and the emphasis marks of the markdown are removed and no word is changed. The table rows that name one value of the service category list are left out of the saved pages of `ServiceCategory` and `ServiceSubcategory`; the tool reads neither list. The pages of the clouds are saved as the text of the HTML page, without the navigation of the site.

Two versions of the specification are saved because the cost and usage columns changed between them: the pages of version 1.2 for the earlier layout and the pages of version 1.4 for the layout of version 1.3 and later. Every column page of each version is saved, so that the list of mandatory columns can be checked against the pages, and a test does so.

A check that no saved page supports is not in the tool, and [limits.md](limits.md) lists what was left out.

## Saved pages

| Page | Address | Saved text |
| --- | --- | --- |
| FOCUS 1.2, column AvailabilityZone | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/availabilityzone.md | `research/sources/focus-1.2-column-availabilityzone.txt` |
| FOCUS 1.2, column BilledCost | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/billedcost.md | `research/sources/focus-1.2-column-billedcost.txt` |
| FOCUS 1.2, column BillingAccountId | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/billingaccountid.md | `research/sources/focus-1.2-column-billingaccountid.txt` |
| FOCUS 1.2, column BillingAccountName | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/billingaccountname.md | `research/sources/focus-1.2-column-billingaccountname.txt` |
| FOCUS 1.2, column BillingAccountType | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/billingaccounttype.md | `research/sources/focus-1.2-column-billingaccounttype.txt` |
| FOCUS 1.2, column BillingCurrency | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/billingcurrency.md | `research/sources/focus-1.2-column-billingcurrency.txt` |
| FOCUS 1.2, column BillingPeriodEnd | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/billingperiodend.md | `research/sources/focus-1.2-column-billingperiodend.txt` |
| FOCUS 1.2, column BillingPeriodStart | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/billingperiodstart.md | `research/sources/focus-1.2-column-billingperiodstart.txt` |
| FOCUS 1.2, column CapacityReservationId | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/capacityreservationid.md | `research/sources/focus-1.2-column-capacityreservationid.txt` |
| FOCUS 1.2, column CapacityReservationStatus | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/capacityreservationstatus.md | `research/sources/focus-1.2-column-capacityreservationstatus.txt` |
| FOCUS 1.2, column ChargeCategory | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/chargecategory.md | `research/sources/focus-1.2-column-chargecategory.txt` |
| FOCUS 1.2, column ChargeClass | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/chargeclass.md | `research/sources/focus-1.2-column-chargeclass.txt` |
| FOCUS 1.2, column ChargeDescription | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/chargedescription.md | `research/sources/focus-1.2-column-chargedescription.txt` |
| FOCUS 1.2, column ChargeFrequency | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/chargefrequency.md | `research/sources/focus-1.2-column-chargefrequency.txt` |
| FOCUS 1.2, column ChargePeriodEnd | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/chargeperiodend.md | `research/sources/focus-1.2-column-chargeperiodend.txt` |
| FOCUS 1.2, column ChargePeriodStart | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/chargeperiodstart.md | `research/sources/focus-1.2-column-chargeperiodstart.txt` |
| FOCUS 1.2, column CommitmentDiscountCategory | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/commitmentdiscountcategory.md | `research/sources/focus-1.2-column-commitmentdiscountcategory.txt` |
| FOCUS 1.2, column CommitmentDiscountId | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/commitmentdiscountid.md | `research/sources/focus-1.2-column-commitmentdiscountid.txt` |
| FOCUS 1.2, column CommitmentDiscountName | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/commitmentdiscountname.md | `research/sources/focus-1.2-column-commitmentdiscountname.txt` |
| FOCUS 1.2, column CommitmentDiscountQuantity | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/commitmentdiscountquantity.md | `research/sources/focus-1.2-column-commitmentdiscountquantity.txt` |
| FOCUS 1.2, column CommitmentDiscountStatus | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/commitmentdiscountstatus.md | `research/sources/focus-1.2-column-commitmentdiscountstatus.txt` |
| FOCUS 1.2, column CommitmentDiscountType | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/commitmentdiscounttype.md | `research/sources/focus-1.2-column-commitmentdiscounttype.txt` |
| FOCUS 1.2, column CommitmentDiscountUnit | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/commitmentdiscountunit.md | `research/sources/focus-1.2-column-commitmentdiscountunit.txt` |
| FOCUS 1.2, column ConsumedQuantity | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/consumedquantity.md | `research/sources/focus-1.2-column-consumedquantity.txt` |
| FOCUS 1.2, column ConsumedUnit | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/consumedunit.md | `research/sources/focus-1.2-column-consumedunit.txt` |
| FOCUS 1.2, column ContractedCost | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/contractedcost.md | `research/sources/focus-1.2-column-contractedcost.txt` |
| FOCUS 1.2, column ContractedUnitPrice | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/contractedunitprice.md | `research/sources/focus-1.2-column-contractedunitprice.txt` |
| FOCUS 1.2, column EffectiveCost | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/effectivecost.md | `research/sources/focus-1.2-column-effectivecost.txt` |
| FOCUS 1.2, column InvoiceId | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/invoiceid.md | `research/sources/focus-1.2-column-invoiceid.txt` |
| FOCUS 1.2, column InvoiceIssuerName | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/invoiceissuer.md | `research/sources/focus-1.2-column-invoiceissuername.txt` |
| FOCUS 1.2, column ListCost | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/listcost.md | `research/sources/focus-1.2-column-listcost.txt` |
| FOCUS 1.2, column ListUnitPrice | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/listunitprice.md | `research/sources/focus-1.2-column-listunitprice.txt` |
| FOCUS 1.2, column PricingCategory | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/pricingcategory.md | `research/sources/focus-1.2-column-pricingcategory.txt` |
| FOCUS 1.2, column PricingCurrency | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/pricingcurrency.md | `research/sources/focus-1.2-column-pricingcurrency.txt` |
| FOCUS 1.2, column PricingCurrencyContractedUnitPrice | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/pricingcurrencycontractedunitprice.md | `research/sources/focus-1.2-column-pricingcurrencycontractedunitprice.txt` |
| FOCUS 1.2, column PricingCurrencyEffectiveCost | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/pricingcurrencyeffectivecost.md | `research/sources/focus-1.2-column-pricingcurrencyeffectivecost.txt` |
| FOCUS 1.2, column PricingCurrencyListUnitPrice | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/pricingcurrencylistunitprice.md | `research/sources/focus-1.2-column-pricingcurrencylistunitprice.txt` |
| FOCUS 1.2, column PricingQuantity | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/pricingquantity.md | `research/sources/focus-1.2-column-pricingquantity.txt` |
| FOCUS 1.2, column PricingUnit | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/pricingunit.md | `research/sources/focus-1.2-column-pricingunit.txt` |
| FOCUS 1.2, column ProviderName | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/provider.md | `research/sources/focus-1.2-column-providername.txt` |
| FOCUS 1.2, column PublisherName | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/publisher.md | `research/sources/focus-1.2-column-publishername.txt` |
| FOCUS 1.2, column RegionId | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/regionid.md | `research/sources/focus-1.2-column-regionid.txt` |
| FOCUS 1.2, column RegionName | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/regionname.md | `research/sources/focus-1.2-column-regionname.txt` |
| FOCUS 1.2, column ResourceId | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/resourceid.md | `research/sources/focus-1.2-column-resourceid.txt` |
| FOCUS 1.2, column ResourceName | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/resourcename.md | `research/sources/focus-1.2-column-resourcename.txt` |
| FOCUS 1.2, column ResourceType | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/resourcetype.md | `research/sources/focus-1.2-column-resourcetype.txt` |
| FOCUS 1.2, column ServiceCategory | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/servicecategory.md | `research/sources/focus-1.2-column-servicecategory.txt` |
| FOCUS 1.2, column ServiceName | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/servicename.md | `research/sources/focus-1.2-column-servicename.txt` |
| FOCUS 1.2, column ServiceSubcategory | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/servicesubcategory.md | `research/sources/focus-1.2-column-servicesubcategory.txt` |
| FOCUS 1.2, column SkuId | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/skuid.md | `research/sources/focus-1.2-column-skuid.txt` |
| FOCUS 1.2, column SkuMeter | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/skumeter.md | `research/sources/focus-1.2-column-skumeter.txt` |
| FOCUS 1.2, column SkuPriceDetails | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/skupricedetails.md | `research/sources/focus-1.2-column-skupricedetails.txt` |
| FOCUS 1.2, column SkuPriceId | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/skupriceid.md | `research/sources/focus-1.2-column-skupriceid.txt` |
| FOCUS 1.2, column SubAccountId | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/subaccountid.md | `research/sources/focus-1.2-column-subaccountid.txt` |
| FOCUS 1.2, column SubAccountName | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/subaccountname.md | `research/sources/focus-1.2-column-subaccountname.txt` |
| FOCUS 1.2, column SubAccountType | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/subaccounttype.md | `research/sources/focus-1.2-column-subaccounttype.txt` |
| FOCUS 1.2, column Tags | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/tags.md | `research/sources/focus-1.2-column-tags.txt` |
| FOCUS 1.2, attribute Column Handling | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/attributes/column_handling.md | `research/sources/focus-1.2-attr-column-handling.txt` |
| FOCUS 1.2, attribute Currency Format | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/attributes/currency_format.md | `research/sources/focus-1.2-attr-currency-format.txt` |
| FOCUS 1.2, attribute Date/Time Format | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/attributes/datetime_format.md | `research/sources/focus-1.2-attr-datetime-format.txt` |
| FOCUS 1.2, attribute Key-Value Format | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/attributes/key_value_format.md | `research/sources/focus-1.2-attr-key-value-format.txt` |
| FOCUS 1.2, attribute Null Handling | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/attributes/null_handling.md | `research/sources/focus-1.2-attr-null-handling.txt` |
| FOCUS 1.2, attribute Numeric Format | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/attributes/numeric_format.md | `research/sources/focus-1.2-attr-numeric-format.txt` |
| FOCUS 1.2, Overview | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/overview.md | `research/sources/focus-1.2-overview.txt` |
| FOCUS 1.4, column AllocatedMethodDetails | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/allocatedmethoddetails.md | `research/sources/focus-1.4-column-allocatedmethoddetails.txt` |
| FOCUS 1.4, column AllocatedMethodId | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/allocatedmethodid.md | `research/sources/focus-1.4-column-allocatedmethodid.txt` |
| FOCUS 1.4, column AllocatedResourceId | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/allocatedresourceid.md | `research/sources/focus-1.4-column-allocatedresourceid.txt` |
| FOCUS 1.4, column AllocatedResourceName | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/allocatedresourcename.md | `research/sources/focus-1.4-column-allocatedresourcename.txt` |
| FOCUS 1.4, column AllocatedTags | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/allocatedtags.md | `research/sources/focus-1.4-column-allocatedtags.txt` |
| FOCUS 1.4, column AvailabilityZone | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/availabilityzone.md | `research/sources/focus-1.4-column-availabilityzone.txt` |
| FOCUS 1.4, column BilledCost | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/billedcost.md | `research/sources/focus-1.4-column-billedcost.txt` |
| FOCUS 1.4, column BillingAccountId | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/billingaccountid.md | `research/sources/focus-1.4-column-billingaccountid.txt` |
| FOCUS 1.4, column BillingAccountName | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/billingaccountname.md | `research/sources/focus-1.4-column-billingaccountname.txt` |
| FOCUS 1.4, column BillingAccountType | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/billingaccounttype.md | `research/sources/focus-1.4-column-billingaccounttype.txt` |
| FOCUS 1.4, column BillingCurrency | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/billingcurrency.md | `research/sources/focus-1.4-column-billingcurrency.txt` |
| FOCUS 1.4, column BillingPeriodEnd | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/billingperiodend.md | `research/sources/focus-1.4-column-billingperiodend.txt` |
| FOCUS 1.4, column BillingPeriodStart | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/billingperiodstart.md | `research/sources/focus-1.4-column-billingperiodstart.txt` |
| FOCUS 1.4, column CapacityReservationId | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/capacityreservationid.md | `research/sources/focus-1.4-column-capacityreservationid.txt` |
| FOCUS 1.4, column CapacityReservationStatus | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/capacityreservationstatus.md | `research/sources/focus-1.4-column-capacityreservationstatus.txt` |
| FOCUS 1.4, column ChargeCategory | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/chargecategory.md | `research/sources/focus-1.4-column-chargecategory.txt` |
| FOCUS 1.4, column ChargeClass | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/chargeclass.md | `research/sources/focus-1.4-column-chargeclass.txt` |
| FOCUS 1.4, column ChargeDescription | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/chargedescription.md | `research/sources/focus-1.4-column-chargedescription.txt` |
| FOCUS 1.4, column ChargeFrequency | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/chargefrequency.md | `research/sources/focus-1.4-column-chargefrequency.txt` |
| FOCUS 1.4, column ChargePeriodEnd | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/chargeperiodend.md | `research/sources/focus-1.4-column-chargeperiodend.txt` |
| FOCUS 1.4, column ChargePeriodStart | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/chargeperiodstart.md | `research/sources/focus-1.4-column-chargeperiodstart.txt` |
| FOCUS 1.4, column CommitmentDiscountCategory | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/commitmentdiscountcategory.md | `research/sources/focus-1.4-column-commitmentdiscountcategory.txt` |
| FOCUS 1.4, column CommitmentDiscountId | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/commitmentdiscountid.md | `research/sources/focus-1.4-column-commitmentdiscountid.txt` |
| FOCUS 1.4, column CommitmentDiscountName | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/commitmentdiscountname.md | `research/sources/focus-1.4-column-commitmentdiscountname.txt` |
| FOCUS 1.4, column CommitmentDiscountQuantity | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/commitmentdiscountquantity.md | `research/sources/focus-1.4-column-commitmentdiscountquantity.txt` |
| FOCUS 1.4, column CommitmentDiscountStatus | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/commitmentdiscountstatus.md | `research/sources/focus-1.4-column-commitmentdiscountstatus.txt` |
| FOCUS 1.4, column CommitmentDiscountType | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/commitmentdiscounttype.md | `research/sources/focus-1.4-column-commitmentdiscounttype.txt` |
| FOCUS 1.4, column CommitmentDiscountUnit | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/commitmentdiscountunit.md | `research/sources/focus-1.4-column-commitmentdiscountunit.txt` |
| FOCUS 1.4, column CommitmentProgramEligibilityDetails | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/commitmentprogrameligibilitydetails.md | `research/sources/focus-1.4-column-commitmentprogrameligibilitydetails.txt` |
| FOCUS 1.4, column ConsumedQuantity | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/consumedquantity.md | `research/sources/focus-1.4-column-consumedquantity.txt` |
| FOCUS 1.4, column ConsumedUnit | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/consumedunit.md | `research/sources/focus-1.4-column-consumedunit.txt` |
| FOCUS 1.4, column ContractApplied | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/contractapplied.md | `research/sources/focus-1.4-column-contractapplied.txt` |
| FOCUS 1.4, column ContractedCost | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/contractedcost.md | `research/sources/focus-1.4-column-contractedcost.txt` |
| FOCUS 1.4, column ContractedUnitPrice | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/contractedunitprice.md | `research/sources/focus-1.4-column-contractedunitprice.txt` |
| FOCUS 1.4, column EffectiveCost | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/effectivecost.md | `research/sources/focus-1.4-column-effectivecost.txt` |
| FOCUS 1.4, column HostProviderName | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/hostprovidername.md | `research/sources/focus-1.4-column-hostprovidername.txt` |
| FOCUS 1.4, column InvoiceDetailId | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/invoicedetailid.md | `research/sources/focus-1.4-column-invoicedetailid.txt` |
| FOCUS 1.4, column InvoiceId | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/invoiceid.md | `research/sources/focus-1.4-column-invoiceid.txt` |
| FOCUS 1.4, column InvoiceIssuerName | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/invoiceissuername.md | `research/sources/focus-1.4-column-invoiceissuername.txt` |
| FOCUS 1.4, column ListCost | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/listcost.md | `research/sources/focus-1.4-column-listcost.txt` |
| FOCUS 1.4, column ListUnitPrice | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/listunitprice.md | `research/sources/focus-1.4-column-listunitprice.txt` |
| FOCUS 1.4, column PricingCategory | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/pricingcategory.md | `research/sources/focus-1.4-column-pricingcategory.txt` |
| FOCUS 1.4, column PricingCurrency | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/pricingcurrency.md | `research/sources/focus-1.4-column-pricingcurrency.txt` |
| FOCUS 1.4, column PricingCurrencyContractedUnitPrice | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/pricingcurrencycontractedunitprice.md | `research/sources/focus-1.4-column-pricingcurrencycontractedunitprice.txt` |
| FOCUS 1.4, column PricingCurrencyEffectiveCost | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/pricingcurrencyeffectivecost.md | `research/sources/focus-1.4-column-pricingcurrencyeffectivecost.txt` |
| FOCUS 1.4, column PricingCurrencyListUnitPrice | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/pricingcurrencylistunitprice.md | `research/sources/focus-1.4-column-pricingcurrencylistunitprice.txt` |
| FOCUS 1.4, column PricingQuantity | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/pricingquantity.md | `research/sources/focus-1.4-column-pricingquantity.txt` |
| FOCUS 1.4, column PricingUnit | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/pricingunit.md | `research/sources/focus-1.4-column-pricingunit.txt` |
| FOCUS 1.4, column RegionId | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/regionid.md | `research/sources/focus-1.4-column-regionid.txt` |
| FOCUS 1.4, column RegionName | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/regionname.md | `research/sources/focus-1.4-column-regionname.txt` |
| FOCUS 1.4, column ResourceId | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/resourceid.md | `research/sources/focus-1.4-column-resourceid.txt` |
| FOCUS 1.4, column ResourceName | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/resourcename.md | `research/sources/focus-1.4-column-resourcename.txt` |
| FOCUS 1.4, column ResourceType | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/resourcetype.md | `research/sources/focus-1.4-column-resourcetype.txt` |
| FOCUS 1.4, column ServiceCategory | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/servicecategory.md | `research/sources/focus-1.4-column-servicecategory.txt` |
| FOCUS 1.4, column ServiceName | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/servicename.md | `research/sources/focus-1.4-column-servicename.txt` |
| FOCUS 1.4, column ServiceProviderName | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/serviceprovidername.md | `research/sources/focus-1.4-column-serviceprovidername.txt` |
| FOCUS 1.4, column ServiceSubcategory | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/servicesubcategory.md | `research/sources/focus-1.4-column-servicesubcategory.txt` |
| FOCUS 1.4, column SkuId | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/skuid.md | `research/sources/focus-1.4-column-skuid.txt` |
| FOCUS 1.4, column SkuMeter | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/skumeter.md | `research/sources/focus-1.4-column-skumeter.txt` |
| FOCUS 1.4, column SkuPriceDetails | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/skupricedetails.md | `research/sources/focus-1.4-column-skupricedetails.txt` |
| FOCUS 1.4, column SkuPriceId | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/skupriceid.md | `research/sources/focus-1.4-column-skupriceid.txt` |
| FOCUS 1.4, column SubAccountId | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/subaccountid.md | `research/sources/focus-1.4-column-subaccountid.txt` |
| FOCUS 1.4, column SubAccountName | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/subaccountname.md | `research/sources/focus-1.4-column-subaccountname.txt` |
| FOCUS 1.4, column SubAccountType | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/subaccounttype.md | `research/sources/focus-1.4-column-subaccounttype.txt` |
| FOCUS 1.4, column Tags | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/datasets/cost_and_usage/columns/tags.md | `research/sources/focus-1.4-column-tags.txt` |
| FOCUS 1.4, attribute FOCUS Column Handling | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/attributes/focus_column_handling.md | `research/sources/focus-1.4-attr-focus-column-handling.txt` |
| FOCUS 1.4, attribute Custom Column Handling | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/attributes/custom_column_handling.md | `research/sources/focus-1.4-attr-custom-column-handling.txt` |
| FOCUS 1.4, attribute Currency Format | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/attributes/currency_format.md | `research/sources/focus-1.4-attr-currency-format.txt` |
| FOCUS 1.4, attribute Date/Time Format | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/attributes/datetime_format.md | `research/sources/focus-1.4-attr-datetime-format.txt` |
| FOCUS 1.4, attribute Key-Value Format | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/attributes/key_value_format.md | `research/sources/focus-1.4-attr-key-value-format.txt` |
| FOCUS 1.4, attribute Null Handling | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/attributes/null_handling.md | `research/sources/focus-1.4-attr-null-handling.txt` |
| FOCUS 1.4, attribute Numeric Format | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/attributes/numeric_format.md | `research/sources/focus-1.4-attr-numeric-format.txt` |
| FOCUS 1.4, Overview | https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/overview.md | `research/sources/focus-1.4-overview.txt` |
| AWS Data Exports, FOCUS 1.0 with AWS columns | https://docs.aws.amazon.com/cur/latest/userguide/table-dictionary-focus-1-0-aws.html | `research/sources/vendor-aws-focus-1-0-table.txt` |
| Microsoft Learn, FOCUS cost and usage details file schema | https://learn.microsoft.com/en-us/azure/cost-management-billing/dataset-schema/cost-usage-details-focus | `research/sources/vendor-azure-focus-file-schema.txt` |
| Microsoft Learn, Create and manage exported data | https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/tutorial-export-acm-data | `research/sources/vendor-azure-export-data.txt` |
| Google Cloud, Set up Cloud Billing data export to BigQuery | https://cloud.google.com/billing/docs/how-to/export-data-bigquery | `research/sources/vendor-google-bigquery-export.txt` |

## Sentences

Each sentence is quoted by a finding, in the JSON and CSV reports with the address of its page. The key is the name in `src/data.js`.

| Key | Page | Sentence |
| --- | --- | --- |
| `mandatory-def` | FOCUS 1.2, Overview, Feature level | If the existence of a column is described with MUST with no conditions of when it applies, then the feature level is designated as 'Mandatory'. |
| `column-pascal` | FOCUS 1.2, attribute Column Handling, Column Names | Column IDs MUST use Pascal case. |
| `custom-prefix` | FOCUS 1.2, attribute Column Handling, Column Names | Custom columns MUST be prefixed with a consistent x_ prefix to identify them as external, custom columns and distinguish them from FOCUS columns to avoid conflicts in future releases. |
| `provider-replaced` | FOCUS 1.4, column ServiceProviderName, Version Introduced | Introduced as a replacement for the removed ProviderName column |
| `service-name-use` | FOCUS 1.2, column ServiceName, Description | The Service Name is commonly used for scenarios like analyzing aggregate cost trends over time and filtering data to investigate anomalies. |
| `eff-trends` | FOCUS 1.2, column EffectiveCost, Description | The Effective Cost is commonly utilized to track and analyze spending trends. |
| `eff-distribute` | FOCUS 1.2, column EffectiveCost, Description | Practitioners need to amortize relevant purchases, such as upfront fees, throughout the commitment and distribute them to the appropriate reporting groups (e.g., tags, resources). |
| `eff-purchase-zero` | FOCUS 1.2, column EffectiveCost, Requirements | EffectiveCost MUST be 0 when ChargeCategory is "Purchase" and the purchase is intended to cover future eligible charges. |
| `eff-credit-billed` | FOCUS 1.2, column EffectiveCost, Requirements | EffectiveCost of a charge unrelated to other charges (e.g., when the ChargeCategory is "Credit") MUST match the BilledCost. |
| `eff-currency` | FOCUS 1.2, column EffectiveCost, Requirements | EffectiveCost MUST be denominated in the BillingCurrency. |
| `billed-basis` | FOCUS 1.2, column BilledCost, Description | The billed cost represents a charge serving as the basis for invoicing, inclusive of the impacts of all reduced rates and discounts while excluding the amortization of relevant purchases (one-time or recurring) paid to cover future eligible charges. |
| `billed-use` | FOCUS 1.2, column BilledCost, Description | The Billed Cost is commonly used to perform FinOps capabilities that require cash-basis accounting such as cost allocation, budgeting, and invoice reconciliation. |
| `billed-currency` | FOCUS 1.2, column BilledCost, Requirements | BilledCost MUST be denominated in the BillingCurrency. |
| `currency-def` | FOCUS 1.2, column BillingCurrency, Description | Billing currency is an identifier that represents the currency that a charge for resources or services was billed in. |
| `currency-national` | FOCUS 1.2, column BillingCurrency, Requirements | BillingCurrency MUST be expressed in national currency (e.g., USD, EUR). |
| `currency-grouped` | FOCUS 1.2, column BillingCurrency, Description | Billing Currency is commonly used in scenarios where costs need to be grouped or aggregated. |
| `cat-not-null` | FOCUS 1.2, column ChargeCategory, Requirements | ChargeCategory MUST NOT be null. |
| `cat-allowed` | FOCUS 1.2, column ChargeCategory, Requirements | ChargeCategory MUST be one of the allowed values. |
| `cat-usage` | FOCUS 1.2, column ChargeCategory, Allowed values, Usage | Positive or negative charges based on the quantity of a service or resource that was consumed over a given period of time including refunds. |
| `cat-purchase` | FOCUS 1.2, column ChargeCategory, Allowed values, Purchase | Positive or negative charges for the acquisition of a service or resource bought upfront or on a recurring basis including refunds. |
| `cat-tax` | FOCUS 1.2, column ChargeCategory, Allowed values, Tax | Positive or negative applicable taxes that are levied by the relevant authorities including refunds. |
| `cat-credit` | FOCUS 1.2, column ChargeCategory, Allowed values, Credit | Positive or negative charges granted by the provider for various scenarios e.g promotional credits or corrections to promotional credits. |
| `cat-adjustment` | FOCUS 1.2, column ChargeCategory, Allowed values, Adjustment | Positive or negative charges the provider applies that do not fall into other category values. |
| `period-start` | FOCUS 1.2, column ChargePeriodStart, Requirements | ChargePeriodStart MUST be the inclusive start bound of the effective period of the charge. |
| `period-end` | FOCUS 1.2, column ChargePeriodEnd, Requirements | ChargePeriodEnd MUST be the exclusive end bound of the effective period of the charge. |
| `period-not-null` | FOCUS 1.2, column ChargePeriodStart, Requirements | ChargePeriodStart MUST NOT be null. |
| `datetime-utc` | FOCUS 1.2, attribute Date/Time Format, Requirements | Date/time values MUST be in UTC (Coordinated Universal Time) to avoid ambiguity and ensure consistency across different time zones. |
| `datetime-form` | FOCUS 1.2, attribute Date/Time Format, Requirements | Values providing information about a specific moment in time MUST be represented in the extended ISO 8601 format with UTC offset ('YYYY-MM-DDTHH:mm:ssZ') and conform to the following guidelines: |
| `numeric-forms` | FOCUS 1.2, attribute Numeric Format, Requirements | Numeric values MUST be expressed as an integer value, a decimal value, or a value expressed in scientific notation. Fractional notation MUST NOT be used. |
| `numeric-sci` | FOCUS 1.2, attribute Numeric Format, Requirements | The sign of the exponent MUST only be expressed as part of the exponent value if n is negative. |
| `numeric-chars` | FOCUS 1.2, attribute Numeric Format, Requirements | Numeric values MUST NOT contain commas or punctuation marks except for a single decimal point (".") if required to express a decimal value. |
| `numeric-sign` | FOCUS 1.2, attribute Numeric Format, Requirements | Numeric values MUST NOT include a character to represent a sign for a positive value. A negative sign (-) MUST indicate a negative value. |
| `numeric-precision` | FOCUS 1.2, attribute Numeric Format, Description | The FOCUS specification does not require a specific level of precision for numeric values. |
| `null-use` | FOCUS 1.2, attribute Null Handling, Requirements | Columns MUST use NULL when there isn't a value that can be specified for a nullable column. |
| `null-no-empty` | FOCUS 1.2, attribute Null Handling, Requirements | Columns MUST NOT use empty strings or placeholder values such as 0 for numeric columns or "Not Applicable" for string columns to represent a null or not having a value, regardless of whether the column allows nulls or not. |
| `tags-use` | FOCUS 1.2, column Tags, Description | Tags are commonly used for scenarios like adding business context to cost and usage data to identify and accurately allocate charges. |
| `tags-present` | FOCUS 1.2, column Tags, Requirements | Tags MUST be present in a FOCUS dataset when the provider supports setting user or provider-defined tags. |
| `tags-null` | FOCUS 1.2, column Tags, Requirements | Tags MAY be null. |
| `tags-null-value` | FOCUS 1.2, column Tags, Requirements | Tags MAY include tag keys with a null value for a given resource depending on the provider's tag finalization process. |
| `kv-json` | FOCUS 1.2, attribute Key-Value Format, Requirements | Key-Value Format columns MUST contain a serialized JSON string, consistent with the ECMA 404 definition of an object. |
| `kv-unique` | FOCUS 1.2, attribute Key-Value Format, Requirements | Keys in a key-value pair MUST be unique within an object. |
| `kv-values` | FOCUS 1.2, attribute Key-Value Format, Requirements | Values in a key-value pair MUST be one of the following types: number, string, true, false, or null. |
| `kv-flat` | FOCUS 1.2, attribute Key-Value Format, Requirements | Values in a key-value pair MUST NOT be an object or an array. |
| `resource-use` | FOCUS 1.2, column ResourceId, Description | The Resource ID is commonly used for cost reporting, analysis, and allocation scenarios. |
| `resource-null` | FOCUS 1.2, column ResourceId, Requirements | ResourceId MUST be null when a charge is not related to a resource. |
| `subaccount-use` | FOCUS 1.2, column SubAccountId, Description | Sub Account ID is commonly used for scenarios like grouping based on organizational constructs, access management needs, and cost allocation strategies. |
| `subaccount-present` | FOCUS 1.2, column SubAccountId, Requirements | SubAccountId MUST be present in a FOCUS dataset when the provider supports a sub account construct. |
| `subaccount-null` | FOCUS 1.2, column SubAccountId, Requirements | SubAccountId MUST be null when a charge is not related to a sub account. |
| `subaccount-not-null` | FOCUS 1.2, column SubAccountId, Requirements | SubAccountId MUST NOT be null when a charge is related to a sub account. |
| `subaccount-name-null` | FOCUS 1.2, column SubAccountName, Requirements | SubAccountName MUST be null when SubAccountId is null. |
| `commit-status-def` | FOCUS 1.2, column CommitmentDiscountStatus, Description | Commitment Discount Status indicates whether the charge corresponds with the consumption of a commitment discount identified in the CommitmentDiscountId column or the unused portion of the committed amount. |
| `commit-used` | FOCUS 1.2, column CommitmentDiscountStatus, Allowed values, Used | Charges that utilized a specific amount of a commitment discount. |
| `commit-unused` | FOCUS 1.2, column CommitmentDiscountStatus, Allowed values, Unused | Charges that represent the unused portion of the commitment discount. |
| `commit-status-null` | FOCUS 1.2, column CommitmentDiscountStatus, Requirements | CommitmentDiscountStatus MUST be null when CommitmentDiscountId is null. |
| `commit-id-null` | FOCUS 1.2, column CommitmentDiscountId, Requirements | CommitmentDiscountId MUST be null when a charge is not related to a commitment discount. |
| `commit-id-use` | FOCUS 1.2, column CommitmentDiscountId, Description | Commitment Discount ID is commonly used for scenarios like chargeback for commitments and savings per commitment discount. |
| `vendor-aws` | AWS Data Exports, FOCUS 1.0 with AWS columns, FOCUS 1.0 with AWS columns | The FOCUS 1.0 with AWS columns table contains your cost and usage data formatted with FinOps Open Cost and Usage Specification (FOCUS) 1.0, along with five additional columns from AWS that contain proprietary billing data. |
| `vendor-azure` | Microsoft Learn, FOCUS cost and usage details file schema, FOCUS cost and usage details file schema | The FOCUS version of the cost and usage details file uses columns, values, and semantics as they're defined in the FinOps Open Cost and Usage Specification (FOCUS) project. |
| `vendor-azure-seconds` | Microsoft Learn, FOCUS cost and usage details file schema, Change notes | The only difference is the extra ":00" for seconds at the end of the time segment of the ISO formatted date string. |
| `vendor-azure-csv` | Microsoft Learn, Create and manage exported data, Create a new export | Choose the Format as CSV or Parquet. |
| `vendor-google` | Google Cloud, Set up Cloud Billing data export to BigQuery, Set up Cloud Billing data export to BigQuery | The FOCUS usage cost export is an immutable BigQuery dataset that contains your detailed usage cost data normalized using the FinOps Open Cost and Usage Specification (FOCUS) standards. |

## Sentence on every mandatory column of the earlier layout

The page of each mandatory column of version 1.2 has the sentence "<Column> MUST be present in a FOCUS dataset.", and a test looks for it on each page. The finding for a missing column quotes it for the first missing column. The pages of version 1.4 state the feature level in the constraints table of each column instead, and the test reads that row.

