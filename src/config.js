import myrouter from 'src/myrouter'
import _ from './supergroup';

//var dotenv = require('dotenv'); // create-react-app loads from .env
//console.log(dotenv);
var config = {
  "cdmSchema": process.env.REACT_APP_CDM_SCHEMA,
  "resultsSchema": process.env.REACT_APP_RESULTS_SCHEMA,
  "apiRoot": process.env.REACT_APP_API_ROOT,
  "apiModel": process.env.REACT_APP_API_MODEL,
  "rootPath": process.env.REACT_APP_ROOTPATH,
  filters: {  // default settings:
    include: {
      vocabularies: [
				"SNOMED", "ICD9CM", "CPT4", "HCPCS", "LOINC", "RXNORM",
				"NDC", "GPI", "UCUM", "GENDER", "RACE", "PLACE OF SERVICE MEDDRA",
				"INDICATION", "ICD10PCS", "DRG", "MDC", "APC",
				"REVENUSE CODE", "ETHNICITY", "NUCC", "SPECIALTY",
				"PCORNET", "ICD10CM", "ABMS", ],
    },
  },
  filterFormSchema: {
    type: "object",
    properties: {
      exclude: {
        title: "Exclude vocabularies",
        type: "array",
        items: {
          type: "string",
          description: "Vocabulary IDs to exclude",
        },
      },
      include: {
        title: "Include vocabularies",
        type: "object",
        properties: {
          vocabularies: {
            description: "Vocabulary IDs to include",
            type: "array",
            items: {
              type: "string"
            }
          },
        },
      },
    }
    /*
    "properties": {
      "excludeInvalidConcepts": {
        "title": "Exclude Invalid Concepts",
        "type": "boolean"
      },
      "excludeNoMatchingConcepts": {
        "title": "Exclude No Matching Concepts",
        "type": "boolean"
      },
      "excludeNonStandardConcepts": {
        "title": "Exclude Non-Standard Concepts",
        "type": "boolean"
      }
    }
    */
  },

};
//console.log(config);

export var notBeingUsedRightNow = {
  // none of the rest being used, but may bring it back
  "menu items": [
    {
      "Home": [
        "Explore concepts/vocabularies independently",
        "Explore concepts referenced in your CDM"
      ]
    },
    {
      "Drug": [
        {
          "type": "group, filter, ignore"
        },
        {
          "class": "group, filter, ignore"
        },
        {
          "column": "drug_concept_id, drug_source_concept_id"
        }
      ]
    },
    "Condition",
    "Search"
  ],
  "left navbar": [
    "Settings",
    "Filters",
    "History",
    "Data loaded"
  ],
  "paths": {
    "drug_exposure": {
      "target": {
        "class": "blah foo"
      }
    }
  },
  "conceptAttributes": [
    "table_name",
    "column_name",
    "standard_concept",
    "domain_id",
    "vocabulary_id",
    "concept_class_id"
  ],
  "tables": {
    "drug_exposure": {
      "rank": 1,
      "tableName": "drug_exposure",
      "niceName": "Drug Exposure",
      "enabled": true,
      "target_col": "drug_concept_id",
      "source_col": "drug_source_concept_id",
      "type_col": "drug_type_concept_id",
      "fk": {
        "person": "person_id, person_id",
        "provider": "provider_id, provider_id"
      }
    },
    "condition_occurrence": {
      "rank": 2,
      "tableName": "condition_occurrence",
      "niceName": "Condition Occurrence",
      "enabled": true,
      "source": "condition_source_concept_id",
      "target": "condition_concept_id",
      "type": "condition_type_concept_id"
    },
    "death": {
      "hidden": true,
      "rank": 30
    },
    "measurement": {
      "hidden": true,
      "rank": 30
    },
    "observation": {
      "hidden": true,
      "rank": 30
    },
    "procedure_occurrence": {
      "hidden": true,
      "rank": 30
    },
    "visit_occurrence": {
      "hidden": true,
      "rank": 30
    }
  },
  "attributes of use": [
    "exclude concept_id=0, No matching concept",
    "include only primary target columns (e.g., drug_concept_id)",
    "include only primary source columns (e.g., drug_source_concept_id)"
  ],
  "mightInclude": [
    "care_site",
    "fact_relationship -- is this table correct?",
    "location?",
    "observation_period?",
    "payer_plan_period?",
    "person (demographics?)",
    "cost tables?",
    "provider (specialty)?",
    "visit"
  ]
}
export const getSetting = path => {
  let query = myrouter.getQuery(path)
  let settings = {...config,...query}
  if (path) 
    return _.get(settings, path)
  return settings
}

let publicCsets = [
  {
    "id": 158396,
    "name": "UGIC",
    "items": []
  },
  {
    "id": 158383,
    "name": "aakasldkjhafduiwefghwiefg",
    "items": [
      {
        "concept": {
          "CONCEPT_ID": 1112807,
          "CONCEPT_NAME": "Aspirin",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "1191",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Ingredient",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": true,
        "includeMapped": false
      }
    ]
  },
  {
    "id": 158062,
    "name": "BP_measurement",
    "items": [
      {
        "concept": {
          "CONCEPT_ID": 4264765,
          "CONCEPT_NAME": "Blood pressure taking",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "46973005",
          "DOMAIN_ID": "Procedure",
          "VOCABULARY_ID": "SNOMED",
          "CONCEPT_CLASS_ID": "Procedure",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": true,
        "includeMapped": true
      },
      {
        "concept": {
          "CONCEPT_ID": 4168708,
          "CONCEPT_NAME": "Examination of blood pressure",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "274785000",
          "DOMAIN_ID": "Procedure",
          "VOCABULARY_ID": "SNOMED",
          "CONCEPT_CLASS_ID": "Procedure",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": true,
        "includeMapped": true
      }
    ]
  },
  {
    "id": 158060,
    "name": "Ibuprofen",
    "items": [
      {
        "concept": {
          "CONCEPT_ID": 1177480,
          "CONCEPT_NAME": "Ibuprofen",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "5640",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Ingredient",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      }
    ]
  },
  {
    "id": 158053,
    "name": "ML-TNFBlockers-783-CS-7",
    "items": [
      {
        "concept": {
          "CONCEPT_ID": 1151789,
          "CONCEPT_NAME": "Etanercept",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "214555",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Ingredient",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": true,
        "includeMapped": true
      },
      {
        "concept": {
          "CONCEPT_ID": 937368,
          "CONCEPT_NAME": "infliximab",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "191831",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Ingredient",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": true,
        "includeMapped": true
      }
    ]
  },
  {
    "id": 158051,
    "name": "ML-Humira-783-CS-2",
    "items": [
      {
        "concept": {
          "CONCEPT_ID": 1119119,
          "CONCEPT_NAME": "adalimumab",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "327361",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Ingredient",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": true,
        "includeMapped": true
      }
    ]
  },
  {
    "id": 158038,
    "name": "ML-TB-783-CS-6",
    "items": [
      {
        "concept": {
          "CONCEPT_ID": 434557,
          "CONCEPT_NAME": "Tuberculosis",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "56717001",
          "DOMAIN_ID": "Condition",
          "VOCABULARY_ID": "SNOMED",
          "CONCEPT_CLASS_ID": "Clinical Finding",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": true,
        "includeMapped": true
      }
    ]
  },
  {
    "id": 158026,
    "name": "pej ami",
    "items": [
      {
        "concept": {
          "CONCEPT_ID": 312327,
          "CONCEPT_NAME": "Acute myocardial infarction",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "57054005",
          "DOMAIN_ID": "Condition",
          "VOCABULARY_ID": "SNOMED",
          "CONCEPT_CLASS_ID": "Clinical Finding",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": true,
        "includeMapped": false
      }
    ]
  },
  {
    "id": 158020,
    "name": "test (diabetes, some icd9 codes)",
    "items": [
      {
        "concept": {
          "CONCEPT_ID": 44833365,
          "CONCEPT_NAME": "Diabetes mellitus",
          "STANDARD_CONCEPT": "N",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "250",
          "DOMAIN_ID": "Condition",
          "VOCABULARY_ID": "ICD9CM",
          "CONCEPT_CLASS_ID": "3-dig nonbill code",
          "STANDARD_CONCEPT_CAPTION": "Non-Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 44826459,
          "CONCEPT_NAME": "Diabetes mellitus with hyperosmolarity",
          "STANDARD_CONCEPT": "N",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "250.2",
          "DOMAIN_ID": "Condition",
          "VOCABULARY_ID": "ICD9CM",
          "CONCEPT_CLASS_ID": "4-dig nonbill code",
          "STANDARD_CONCEPT_CAPTION": "Non-Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 44834548,
          "CONCEPT_NAME": "Diabetes mellitus without mention of complication",
          "STANDARD_CONCEPT": "N",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "250.0",
          "DOMAIN_ID": "Condition",
          "VOCABULARY_ID": "ICD9CM",
          "CONCEPT_CLASS_ID": "4-dig nonbill code",
          "STANDARD_CONCEPT_CAPTION": "Non-Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": true
      }
    ]
  },
  {
    "id": 158013,
    "name": "Attention-Test",
    "items": [
      {
        "concept": {
          "CONCEPT_ID": 438409,
          "CONCEPT_NAME": "Attention deficit hyperactivity disorder",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "406506008",
          "DOMAIN_ID": "Condition",
          "VOCABULARY_ID": "SNOMED",
          "CONCEPT_CLASS_ID": "Clinical Finding",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": true,
        "includeMapped": true
      },
      {
        "concept": {
          "CONCEPT_ID": 440086,
          "CONCEPT_NAME": "Child attention deficit disorder",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "192127007",
          "DOMAIN_ID": "Condition",
          "VOCABULARY_ID": "SNOMED",
          "CONCEPT_CLASS_ID": "Clinical Finding",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": true,
        "includeMapped": true
      }
    ]
  },
  {
    "id": 158009,
    "name": "ML-HIV-782-CS-4",
    "items": [
      {
        "concept": {
          "CONCEPT_ID": 439727,
          "CONCEPT_NAME": "Human immunodeficiency virus infection",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "86406008",
          "DOMAIN_ID": "Condition",
          "VOCABULARY_ID": "SNOMED",
          "CONCEPT_CLASS_ID": "Clinical Finding",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": true,
        "includeMapped": true
      }
    ]
  },
  {
    "id": 158006,
    "name": "ML-Allergy-782-CS-3",
    "items": [
      {
        "concept": {
          "CONCEPT_ID": 439224,
          "CONCEPT_NAME": "Drug allergy",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "416098002",
          "DOMAIN_ID": "Condition",
          "VOCABULARY_ID": "SNOMED",
          "CONCEPT_CLASS_ID": "Clinical Finding",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": true,
        "includeMapped": true
      },
      {
        "concept": {
          "CONCEPT_ID": 4163204,
          "CONCEPT_NAME": "Methotrexate allergy",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "293771005",
          "DOMAIN_ID": "Condition",
          "VOCABULARY_ID": "SNOMED",
          "CONCEPT_CLASS_ID": "Clinical Finding",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": true,
        "includeMapped": true
      }
    ]
  },
  {
    "id": 158001,
    "name": "ML-Pregnancy-782-CS-2",
    "items": [
      {
        "concept": {
          "CONCEPT_ID": 435875,
          "CONCEPT_NAME": "Complication of pregnancy, childbirth and/or the puerperium",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "198609003",
          "DOMAIN_ID": "Condition",
          "VOCABULARY_ID": "SNOMED",
          "CONCEPT_CLASS_ID": "Clinical Finding",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": true,
        "includeMapped": true
      },
      {
        "concept": {
          "CONCEPT_ID": 439658,
          "CONCEPT_NAME": "Disorder of pregnancy",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "173300003",
          "DOMAIN_ID": "Condition",
          "VOCABULARY_ID": "SNOMED",
          "CONCEPT_CLASS_ID": "Clinical Finding",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": true,
        "includeMapped": true
      },
      {
        "concept": {
          "CONCEPT_ID": 444094,
          "CONCEPT_NAME": "Finding related to pregnancy",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "118185001",
          "DOMAIN_ID": "Condition",
          "VOCABULARY_ID": "SNOMED",
          "CONCEPT_CLASS_ID": "Clinical Finding",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": true,
        "includeMapped": true
      },
      {
        "concept": {
          "CONCEPT_ID": 4088927,
          "CONCEPT_NAME": "Pregnancy, childbirth and puerperium finding",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "248982007",
          "DOMAIN_ID": "Condition",
          "VOCABULARY_ID": "SNOMED",
          "CONCEPT_CLASS_ID": "Clinical Finding",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": true,
        "includeMapped": true
      }
    ]
  },
  {
    "id": 157999,
    "name": "ML-Methotrexate-782-CS-1",
    "items": [
      {
        "concept": {
          "CONCEPT_ID": 1305058,
          "CONCEPT_NAME": "Methotrexate",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "6851",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Ingredient",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": true,
        "includeMapped": true
      }
    ]
  },
  {
    "id": 157996,
    "name": "ML-RA-782-CS-0",
    "items": [
      {
        "concept": {
          "CONCEPT_ID": 80809,
          "CONCEPT_NAME": "Rheumatoid arthritis",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "69896004",
          "DOMAIN_ID": "Condition",
          "VOCABULARY_ID": "SNOMED",
          "CONCEPT_CLASS_ID": "Clinical Finding",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": true,
        "includeMapped": true
      }
    ]
  },
  {
    "id": 157916,
    "name": "IBD drugs",
    "items": [
      {
        "concept": {
          "CONCEPT_ID": 1119119,
          "CONCEPT_NAME": "adalimumab",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "327361",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Ingredient",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19014878,
          "CONCEPT_NAME": "Azathioprine",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "1256",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Ingredient",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19099736,
          "CONCEPT_NAME": "Azathioprine 100 MG",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "360266",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Clinical Drug Comp",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19045824,
          "CONCEPT_NAME": "Azathioprine 100 MG [Azasan]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "576427",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug Comp",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19014903,
          "CONCEPT_NAME": "Azathioprine 100 MG Injection",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "239983",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Clinical Drug",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19014907,
          "CONCEPT_NAME": "Azathioprine 100 MG Oral Tablet",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "359228",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Clinical Drug",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19102775,
          "CONCEPT_NAME": "Azathioprine 100 MG Oral Tablet [Azasan]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "404476",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19101255,
          "CONCEPT_NAME": "Azathioprine 10 MG",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "385562",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Clinical Drug Comp",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19117029,
          "CONCEPT_NAME": "Azathioprine 10 MG [Imuran]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "565180",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug Comp",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19016894,
          "CONCEPT_NAME": "Azathioprine 10 MG Oral Tablet",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "153129",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Clinical Drug",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19016895,
          "CONCEPT_NAME": "Azathioprine 10 MG Oral Tablet [Imuran]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "153130",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19108233,
          "CONCEPT_NAME": "Azathioprine 250 MG",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "434684",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Clinical Drug Comp",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19103333,
          "CONCEPT_NAME": "Azathioprine 250 MG Oral Capsule",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "410148",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Clinical Drug",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19014905,
          "CONCEPT_NAME": "Azathioprine 25 MG",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "329313",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Clinical Drug Comp",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19125814,
          "CONCEPT_NAME": "Azathioprine 25 MG [Azasan]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "701337",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug Comp",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19116222,
          "CONCEPT_NAME": "Azathioprine 25 MG [Imuran]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "564119",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug Comp",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19021548,
          "CONCEPT_NAME": "Azathioprine 25 MG Oral Tablet",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "199310",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Clinical Drug",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19125815,
          "CONCEPT_NAME": "Azathioprine 25 MG Oral Tablet [Azasan]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "701338",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19007423,
          "CONCEPT_NAME": "Azathioprine 25 MG Oral Tablet [Imuran]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "105610",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19014904,
          "CONCEPT_NAME": "Azathioprine 50 MG",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "315447",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Clinical Drug Comp",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19116221,
          "CONCEPT_NAME": "Azathioprine 50 MG [Azamune]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "564118",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug Comp",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19121113,
          "CONCEPT_NAME": "Azathioprine 50 MG [Azasan]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "576332",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug Comp",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19116225,
          "CONCEPT_NAME": "Azathioprine 50 MG [Berkaprine]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "564122",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug Comp",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19116224,
          "CONCEPT_NAME": "Azathioprine 50 MG [Immunoprin]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "564121",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug Comp",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19116223,
          "CONCEPT_NAME": "Azathioprine 50 MG [Imuran]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "564120",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug Comp",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19116651,
          "CONCEPT_NAME": "Azathioprine 50 MG [Oprisine]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "564655",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug Comp",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19014880,
          "CONCEPT_NAME": "Azathioprine 50 MG Oral Tablet",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "197388",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Clinical Drug",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19007421,
          "CONCEPT_NAME": "Azathioprine 50 MG Oral Tablet [Azamune]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "105609",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19102708,
          "CONCEPT_NAME": "Azathioprine 50 MG Oral Tablet [Azasan]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "404351",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19007426,
          "CONCEPT_NAME": "Azathioprine 50 MG Oral Tablet [Berkaprine]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "105613",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19007425,
          "CONCEPT_NAME": "Azathioprine 50 MG Oral Tablet [Immunoprin]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "105612",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19007424,
          "CONCEPT_NAME": "Azathioprine 50 MG Oral Tablet [Imuran]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "105611",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19010750,
          "CONCEPT_NAME": "Azathioprine 50 MG Oral Tablet [Oprisine]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "108922",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19099735,
          "CONCEPT_NAME": "Azathioprine 75 MG",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "360265",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Clinical Drug Comp",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19045823,
          "CONCEPT_NAME": "Azathioprine 75 MG [Azasan]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "576426",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug Comp",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19014908,
          "CONCEPT_NAME": "Azathioprine 75 MG Oral Tablet",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "359229",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Clinical Drug",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19102774,
          "CONCEPT_NAME": "Azathioprine 75 MG Oral Tablet [Azasan]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "404475",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 42629301,
          "CONCEPT_NAME": "Azathioprine Injection",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "1789839",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Clinical Drug Form",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 40012751,
          "CONCEPT_NAME": "Azathioprine Oral Capsule",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "434685",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Clinical Drug Form",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 40012752,
          "CONCEPT_NAME": "Azathioprine Oral Tablet",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "370973",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Clinical Drug Form",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 40012753,
          "CONCEPT_NAME": "Azathioprine Oral Tablet [Azamune]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "369525",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug Form",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 40012754,
          "CONCEPT_NAME": "Azathioprine Oral Tablet [Azasan]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "405819",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug Form",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 40012755,
          "CONCEPT_NAME": "Azathioprine Oral Tablet [Berkaprine]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "368521",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug Form",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 40012756,
          "CONCEPT_NAME": "Azathioprine Oral Tablet [Immunoprin]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "369534",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug Form",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 40012757,
          "CONCEPT_NAME": "Azathioprine Oral Tablet [Imuran]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "368214",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug Form",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 40012758,
          "CONCEPT_NAME": "Azathioprine Oral Tablet [Oprisine]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "403109",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug Form",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 934262,
          "CONCEPT_NAME": "balsalazide",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "18747",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Ingredient",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 912263,
          "CONCEPT_NAME": "certolizumab pegol",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "709271",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Ingredient",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 937368,
          "CONCEPT_NAME": "infliximab",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "191831",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Ingredient",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 1436650,
          "CONCEPT_NAME": "mercaptopurine",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "103",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Ingredient",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19088312,
          "CONCEPT_NAME": "mercaptopurine 10 MG",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "332204",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Clinical Drug Comp",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19022284,
          "CONCEPT_NAME": "mercaptopurine 10 MG Oral Tablet",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "199766",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Clinical Drug",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 44817921,
          "CONCEPT_NAME": "mercaptopurine 20 MG/ML",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "1536481",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Clinical Drug Comp",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 44818291,
          "CONCEPT_NAME": "mercaptopurine 20 MG/ML Oral Suspension",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "1536484",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Clinical Drug",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 44818292,
          "CONCEPT_NAME": "mercaptopurine 20 MG/ML Oral Suspension [Purixan]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "1536490",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 44817924,
          "CONCEPT_NAME": "mercaptopurine 20 MG/ML [Purixan]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "1536486",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug Comp",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 1436653,
          "CONCEPT_NAME": "mercaptopurine 50 MG",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "316246",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Clinical Drug Comp",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 1436651,
          "CONCEPT_NAME": "mercaptopurine 50 MG Oral Tablet",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "197931",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Clinical Drug",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19033466,
          "CONCEPT_NAME": "mercaptopurine 50 MG Oral Tablet [Purinethol]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "206788",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 19078978,
          "CONCEPT_NAME": "mercaptopurine 50 MG [Purinethol]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "567599",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug Comp",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 44817922,
          "CONCEPT_NAME": "mercaptopurine Oral Suspension",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "1536483",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Clinical Drug Form",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 44817925,
          "CONCEPT_NAME": "mercaptopurine Oral Suspension [Purixan]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "1536487",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug Form",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 40001921,
          "CONCEPT_NAME": "mercaptopurine Oral Tablet",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "372782",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Clinical Drug Form",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 40001922,
          "CONCEPT_NAME": "mercaptopurine Oral Tablet [Purinethol]",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "368861",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Branded Drug Form",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 968426,
          "CONCEPT_NAME": "mesalamine",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "52582",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Ingredient",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 1305058,
          "CONCEPT_NAME": "Methotrexate",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "6851",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Ingredient",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 916282,
          "CONCEPT_NAME": "olsalazine",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "32385",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Ingredient",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      },
      {
        "concept": {
          "CONCEPT_ID": 964339,
          "CONCEPT_NAME": "Sulfasalazine",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "9524",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Ingredient",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      }
    ]
  },
  {
    "id": 157914,
    "name": "IBD",
    "items": [
      {
        "concept": {
          "CONCEPT_ID": 4074815,
          "CONCEPT_NAME": "Inflammatory bowel disease",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "24526004",
          "DOMAIN_ID": "Condition",
          "VOCABULARY_ID": "SNOMED",
          "CONCEPT_CLASS_ID": "Clinical Finding",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": false,
        "includeMapped": false
      }
    ]
  },
  {
    "id": 157907,
    "name": "ohdsi demo stroke concept set-1",
    "items": [
      {
        "concept": {
          "CONCEPT_ID": 4350720,
          "CONCEPT_NAME": "Stroke",
          "STANDARD_CONCEPT": "C",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "N0000004160",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "NDFRT",
          "CONCEPT_CLASS_ID": "Ind / CI",
          "STANDARD_CONCEPT_CAPTION": "Classification",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": true,
        "includeMapped": false
      }
    ]
  },
  {
    "id": 157904,
    "name": "ohdsi demo warfarin concept set-1",
    "items": [
      {
        "concept": {
          "CONCEPT_ID": 1310149,
          "CONCEPT_NAME": "Warfarin",
          "STANDARD_CONCEPT": "S",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "11289",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "RxNorm",
          "CONCEPT_CLASS_ID": "Ingredient",
          "STANDARD_CONCEPT_CAPTION": "Standard",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": true,
        "includeMapped": false
      }
    ]
  },
  {
    "id": 157901,
    "name": "ohdsi demo aspirin concept set-1",
    "items": [
      {
        "concept": {
          "CONCEPT_ID": 4325480,
          "CONCEPT_NAME": "Aspirin",
          "STANDARD_CONCEPT": "C",
          "INVALID_REASON": "V",
          "CONCEPT_CODE": "N0000006582",
          "DOMAIN_ID": "Drug",
          "VOCABULARY_ID": "NDFRT",
          "CONCEPT_CLASS_ID": "Chemical Structure",
          "STANDARD_CONCEPT_CAPTION": "Classification",
          "INVALID_REASON_CAPTION": "Valid"
        },
        "isExcluded": false,
        "includeDescendants": true,
        "includeMapped": false
      }
    ]
  }
]


window.publicCsets= publicCsets

export default config;
