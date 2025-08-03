"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

// Category mapping for display names
const CATEGORY_NAMES: Record<string, string> = {
    // Common Filters
    "6":   "ADHD",
    "3":   "Anxiety",
    "1201":"Couples Counselling",
    "2":   "Depression",
    "301": "EMDR",
    "1200":"Marriage Counselling",
    "326": "Teen",
    "19":  "Trauma and PTSD",
  
    // Gender
    "1001": "Female",
    "1002": "Male",
    "1712": "Non-Binary",
  
    // Session Type (annotated for clarity)
    "1995": "In Person (Session Type)",
    "595":  "Online (Session Type)",
    "1996": "Available (Session Type)",
  
    // Specialties
    "4":    "Addiction",
    "180":  "Adoption",
    "248":  "Alcohol Use",
    "166":  "Anger Management",
    "167":  "Autism",
    "195":  "Behavioural Issues",
    "168":  "Bipolar Disorder",
    "1703": "Body Positivity",
    "196":  "Borderline Personality (BPD)",
    "267":  "Cancer",
    "183":  "Career Guidance",
    "5":    "Child",
    "636":  "Chronic Illness",
    "7":    "Chronic Pain",
    "503":  "Codependency",
    "193":  "Dementia",
    "20":   "Dissociative Disorders (DID)",
    "26":   "Divorce",
    "8":    "Domestic Abuse",
    "253":  "Drug Abuse",
    "263":  "Dual Diagnosis",
    "9":    "Eating Disorders",
    "184":  "Education and Learning Disabilities",
    "1997": "First Responders",
    "254":  "Gambling",
    "10":   "Geriatric and Seniors",
    "14":   "Grief",
    "646":  "Hoarding",
    "12":   "Infertility",
    "551":  "Infidelity",
    "264":  "Intellectual Disability",
    "202":  "Internet Addiction",
    "13":   "Life Coaching",
    "259":  "Medical Detox",
    "258":  "Medication Management",
    "576":  "Men's Issues",
    "203":  "Narcissistic Personality (NPD)",
    "255":  "Obesity",
    "15":   "Obsessive-Compulsive (OCD)",
    "1704": "Open Relationships Non-Monogamy",
    "204":  "Oppositional Defiance (ODD)",
    "16":   "Parenting",
    "22":   "Personality Disorders",
    "578":  "Pregnancy, Prenatal, Postpartum",
    "23":   "Psychosis",
    "584":  "Racial Identity",
    "1":    "Relationship Issues",
    "260":  "Self Esteem",
    "283":  "Self-Harming",
    "17":   "Sex Therapy",
    "1705": "Sex-Positive, Kink Allied",
    "256":  "Sexual Abuse",
    "257":  "Sexual Addiction",
    "190":  "Sleep or Insomnia",
    "18":   "Spirituality",
    "597":  "Sports Performance",
    "632":  "Stress",
    "182":  "Substance Use",
    "205":  "Suicidal Ideation",
    "177":  "Testing and Evaluation",
    "187":  "Transgender",
    "206":  "Traumatic Brain Injury (TBI)",
    "510":  "Veterans",
    "207":  "Video Game Addiction",
    "262":  "Weight Loss",
    "575":  "Women's Issues",
  
    // Insurance
    "415":  "Aetna",
    "1934": "Alberta Blue Cross",
    "416":  "Alliance",
    "1939": "Arete",
    "1947": "ASEBP | Alberta School Employee",
    "590":  "Blue Cross",
    "592":  "Blue Shield",
    "423":  "BlueCross BlueShield",
    "1937": "Canada Life | Great-West Life",
    "1988": "Chambers of Commerce",
    "1989": "CINUP",
    "431":  "ComPsych",
    "1940": "Crime Victim (CVAP/VQRP/IVAC)",
    "1935": "Desjardins",
    "513":  "Empire Blue Cross Blue Shield",
    "1933": "Equitable Life of Canada",
    "1946": "First Canadian Health",
    "434":  "First Choice Health | FCH",
    "437":  "Great-West Life",
    "561":  "Green Shield Canada",
    "438":  "Guardian",
    "440":  "Health Net",
    "1824": "Homewood Health",
    "445":  "Humana",
    "1949": "iA Financial | Industrial Alliance",
    "1823": "Insurance Corporation of British Columbia",
    "1991": "Johnson Health Plan",
    "1987": "Johnston Group",
    "449":  "LifeWise",
    "642":  "Manulife",
    "1990": "Maximum Benefit",
    "1826": "Medavie Blue Cross",
    "456":  "Medicare",
    "549":  "Meridian",
    "526":  "Military OneSource",
    "458":  "MultiPlan",
    "1932": "Non-Insured Health | First Nations",
    "638":  "Pacific Blue Cross",
    "1950": "RCMP | Royal Canadian Mounted Police",
    "543":  "Sentara Health Plans",
    "640":  "SunLife",
    "1822": "TELUS Health",
    "1943": "The Co-operators",
    "473":  "UHC UnitedHealthcare | UBH United Behavioral Health",
    "1948": "Veterans Affairs Canada (VAC)",
    "1938": "WSIB | Workplace Safety Insurance Board",
  
    // Types of Therapy
    "293":  "Cognitive Behavioural (CBT)",
    "495":  "Trauma Focused",
    "1203": "Family Therapy",
    "630":  "Strength-Based",
    "628":  "Person-Centered",
  
    // Age
    "329": "Toddler",
    "325": "Children (6 to 10)",
    "330": "Preteen",
    "327": "Adults",
    "328": "Elders (65+)",
  
    // Ethnicity
    "335": "Asian",
    "334": "Black",
    "337": "Indigenous Peoples",
    "336": "Hispanic and Latino",
    "338": "Pacific Islander",
  
    // Sexuality
    "185": "Bisexual",
    "186": "Lesbian",
    "172": "LGBTQ+",
  
    // Language
    "341":  "Arabic",
    "364":  "Armenian",
    "359":  "Bosnian",
    "342":  "Cantonese",
    "360":  "Croatian",
    "366":  "Farsi",
    "354":  "Filipino",
    "344":  "French",
    "345":  "German",
    "355":  "Greek",
    "365":  "Gujarati",
    "1848":"Haitian Creole",
    "346":  "Hebrew",
    "347":  "Hindi",
    "579":  "Hungarian",
    "348":  "Italian",
    "356":  "Japanese",
    "357":  "Korean",
    "343":  "Mandarin",
    "367":  "Polish",
    "349":  "Portuguese",
    "350":  "Punjabi",
    "369":  "Romanian",
    "351":  "Russian",
    "361":  "Serbian",
    "340":  "Sign Language (ASL)",
    "352":  "Sinhalese",
    "353":  "Spanish",
    "1733":"Tamil",
    "372":  "Turkish",
    "368":  "Ukrainian",
    "370":  "Urdu",
    "363":  "Vietnamese",
  
    // Faith
    "404": "Buddhist",
    "405": "Christian",
    "598": "Hindu",
    "407": "Jewish",
    "406": "Muslim",
    "1970":"Secular and Non-Religious",
    "1876":"Sikh",
    "408": "The Church of Jesus Christ of Latter-day Saints",
  };

interface TherapistMatchData {
  match_count: number;
  filters_applied: number[];
  location?: {
    id: number;
    type: string;
    regionCode: string;
  };
  message: string;
}

export function TherapistMatch({
  matchData,
}: {
  matchData?: TherapistMatchData;
}) {
  if (!matchData) {
    return null;
  }

  const { match_count } = matchData;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-green-600 text-sm font-medium",
        "border-green-200  shadow-sm",
        "transition-all duration-200"
      )}
    >
      <div className={cn(
        "w-1.5 h-1.5 rounded-full bg-green-500",
        match_count > 0 ? "animate-pulse" : ""
      )} />
      <span>
        {match_count} matching therapists
      </span>
    </div>
  );
}

export function TherapistMatchIndicator({
  matchCount,
  attributeIds = [],
}: {
  matchCount?: number;
  attributeIds?: number[];
}) {
  if (typeof matchCount !== 'number') {
    return null;
  }

  // Convert attribute IDs to readable names
  const categoryNames = attributeIds
    .map(id => CATEGORY_NAMES[id.toString()])
    .filter(Boolean);

  const displayText = categoryNames.length > 0 
    ? `${categoryNames.join(', ').toLowerCase()}`
    : `${matchCount}${matchCount === 10000 ? "+ matches" : " matches"}`;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-7 px-2.5 text-xs font-medium text-green-600 border-green-300/30 bg-transparent",
            "hover:border-green-400/60 hover:text-green-700 hover:bg-green-50/50 hover:shadow-green-200/50 hover:shadow-md",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-400",
            "transition-all duration-200"
          )}
          style={{
            textShadow: '0 0 8px rgba(34, 197, 94, 0.3)',
          }}
        >
          <div 
            className={cn(
              "w-1.5 h-1.5 rounded-full bg-green-500 mr-2",
              matchCount > 0 ? "animate-pulse" : ""
            )}
            style={{
              boxShadow: '0 0 6px rgba(34, 197, 94, 0.6)',
            }}
          />
          {matchCount} matches
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-64" side="top">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <h4 className="text-sm font-semibold text-green-700">Therapist Matches</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            {displayText}
          </p>
          <div className="text-xs text-muted-foreground">
            Continue the conversation to refine your search.
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}