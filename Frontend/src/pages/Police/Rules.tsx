import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Shield,
  FileText,
  Users,
  Search,
  ChevronDown,
  ChevronRight,
  Scale,
  BookOpen,
  AlertTriangle,
  Gavel,
  Siren,
  HandMetal,
  Car,
  Flame,
  Skull,
  Ban,
  ShieldAlert,
  Landmark,
  Banknote,
  Pill,
  Baby,
  Heart,
  Home,
  Bomb,
  KeyRound,
  Info,
  CalendarIcon,
  Calendar,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const navItems = [
  {
    label: "Dashboard",
    href: "/police/dashboard",
    icon: <Shield className="h-4 w-4" />,
  },
  {
    label: "Calendar of F.I.Rs",
    href: "/police/calendar",
    icon: <Calendar className="h-4 w-4" />,
  },
  // {
  //   label: "Chat",
  //   href: "/police/chat",
  //   icon: <MessageCircle className="h-4 w-4" />
  // },
  {
    label: "Rules & Laws",
    href: "/police/rules",
    icon: <Scale className="h-4 w-4" />,
  },
];

// ─── Types ───
interface LawSection {
  section: string;
  title: string;
  description: string;
  punishment: string;
  bailable: boolean;
  cognizable: boolean;
  compoundable: boolean;
}

interface LawCategory {
  id: string;
  category: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
  sections: LawSection[];
}

// ─── Law Data ───
const lawCategories: LawCategory[] = [
  {
    id: "theft",
    category: "Theft & Robbery",
    icon: <KeyRound className="h-5 w-5" />,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    description: "Laws related to theft, robbery, dacoity, and extortion",
    sections: [
      {
        section: "Section 378 IPC",
        title: "Theft",
        description:
          "Whoever, intending to take dishonestly any moveable property out of the possession of any person without that person's consent, moves that property in order to such taking, is said to commit theft.",
        punishment: "Imprisonment up to 3 years, or fine, or both",
        bailable: true,
        cognizable: false,
        compoundable: true,
      },
      {
        section: "Section 379 IPC",
        title: "Punishment for Theft",
        description:
          "Whoever commits theft shall be punished with imprisonment of either description for a term which may extend to three years, or with fine, or with both.",
        punishment: "Imprisonment up to 3 years, or fine, or both",
        bailable: true,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 390 IPC",
        title: "Robbery",
        description:
          "In all robbery there is either theft or extortion. When theft is robbery — Theft is robbery if the offender causes or attempts to cause death, hurt or wrongful restraint.",
        punishment: "Imprisonment up to 10 years and fine",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 392 IPC",
        title: "Punishment for Robbery",
        description:
          "Whoever commits robbery shall be punished with rigorous imprisonment for a term which may extend to ten years, and shall also be liable to fine.",
        punishment: "Rigorous imprisonment up to 10 years and fine",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 395 IPC",
        title: "Punishment for Dacoity",
        description:
          "Whoever commits dacoity shall be punished with imprisonment for life, or with rigorous imprisonment for a term which may extend to ten years, and shall also be liable to fine.",
        punishment: "Life imprisonment or RI up to 10 years and fine",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 397 IPC",
        title: "Robbery or Dacoity with attempt to cause death or grievous hurt",
        description:
          "If at the time of committing robbery or dacoity, the offender uses any deadly weapon, or causes grievous hurt to any person.",
        punishment: "Imprisonment not less than 7 years",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
    ],
  },
  {
    id: "assault",
    category: "Assault & Violence",
    icon: <HandMetal className="h-5 w-5" />,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    description: "Laws related to physical assault, hurt, and bodily harm",
    sections: [
      {
        section: "Section 319 IPC",
        title: "Hurt",
        description:
          "Whoever causes bodily pain, disease or infirmity to any person is said to cause hurt.",
        punishment: "Imprisonment up to 1 year, or fine up to ₹1000, or both",
        bailable: true,
        cognizable: false,
        compoundable: true,
      },
      {
        section: "Section 320 IPC",
        title: "Grievous Hurt",
        description:
          "Emasculation, permanent privation of sight or hearing, privation of any member or joint, destruction or permanent impairing of any member or joint, permanent disfiguration of the head or face, fracture or dislocation of a bone or tooth.",
        punishment: "Imprisonment up to 7 years and fine",
        bailable: true,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 323 IPC",
        title: "Punishment for voluntarily causing hurt",
        description:
          "Whoever voluntarily causes hurt shall be punished with imprisonment which may extend to one year, or with fine which may extend to one thousand rupees, or with both.",
        punishment: "Imprisonment up to 1 year, or fine up to ₹1000, or both",
        bailable: true,
        cognizable: false,
        compoundable: true,
      },
      {
        section: "Section 325 IPC",
        title: "Punishment for voluntarily causing grievous hurt",
        description:
          "Whoever voluntarily causes grievous hurt shall be punished with imprisonment up to seven years and fine.",
        punishment: "Imprisonment up to 7 years and fine",
        bailable: true,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 326 IPC",
        title: "Voluntarily causing grievous hurt by dangerous weapons",
        description:
          "Whoever voluntarily causes grievous hurt by means of any instrument for shooting, stabbing or cutting, or by means of fire or any heated substance, or by means of any poison or corrosive substance.",
        punishment: "Life imprisonment or imprisonment up to 10 years and fine",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 352 IPC",
        title: "Assault or criminal force otherwise than on grave provocation",
        description:
          "Whoever assaults or uses criminal force to any person otherwise than on grave and sudden provocation given by that person.",
        punishment: "Imprisonment up to 3 months, or fine up to ₹500, or both",
        bailable: true,
        cognizable: false,
        compoundable: true,
      },
    ],
  },
  {
    id: "murder",
    category: "Murder & Culpable Homicide",
    icon: <Skull className="h-5 w-5" />,
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
    description: "Laws related to murder, culpable homicide, and causing death",
    sections: [
      {
        section: "Section 299 IPC",
        title: "Culpable Homicide",
        description:
          "Whoever causes death by doing an act with the intention of causing death, or with the intention of causing such bodily injury as is likely to cause death, or with the knowledge that he is likely by such act to cause death.",
        punishment: "Varies based on circumstances",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 300 IPC",
        title: "Murder",
        description:
          "Culpable homicide is murder if the act by which the death is caused is done with the intention of causing death, or if it is done with the intention of causing such bodily injury as the offender knows to be likely to cause the death.",
        punishment: "Death or life imprisonment and fine",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 302 IPC",
        title: "Punishment for Murder",
        description:
          "Whoever commits murder shall be punished with death, or imprisonment for life, and shall also be liable to fine.",
        punishment: "Death or life imprisonment and fine",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 304 IPC",
        title: "Punishment for Culpable Homicide not amounting to Murder",
        description:
          "If the act is done with the intention of causing death or such bodily injury as is likely to cause death — imprisonment for life or up to 10 years and fine.",
        punishment: "Life imprisonment or imprisonment up to 10 years and fine",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 304A IPC",
        title: "Causing death by negligence",
        description:
          "Whoever causes the death of any person by doing any rash or negligent act not amounting to culpable homicide.",
        punishment: "Imprisonment up to 2 years, or fine, or both",
        bailable: true,
        cognizable: false,
        compoundable: false,
      },
      {
        section: "Section 307 IPC",
        title: "Attempt to Murder",
        description:
          "Whoever does any act with such intention or knowledge, and under such circumstances that, if he by that act caused death, he would be guilty of murder.",
        punishment: "Imprisonment up to 10 years and fine; if hurt is caused — life imprisonment",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
    ],
  },
  {
    id: "women",
    category: "Crimes Against Women",
    icon: <Heart className="h-5 w-5" />,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    description: "Laws protecting women from harassment, assault, and domestic violence",
    sections: [
      {
        section: "Section 354 IPC",
        title: "Assault or criminal force to woman with intent to outrage modesty",
        description:
          "Whoever assaults or uses criminal force to any woman, intending to outrage or knowing it to be likely that he will thereby outrage her modesty.",
        punishment: "Imprisonment not less than 1 year, may extend to 5 years and fine",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 354A IPC",
        title: "Sexual Harassment",
        description:
          "Physical contact and advances involving unwelcome and explicit sexual overtures; a demand or request for sexual favours; showing pornography against the will of a woman; making sexually coloured remarks.",
        punishment: "Imprisonment up to 3 years, or fine, or both",
        bailable: true,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 354D IPC",
        title: "Stalking",
        description:
          "Any man who follows a woman or contacts or attempts to contact her to foster personal interaction despite clear indication of disinterest, or monitors her use of internet, email or any form of electronic communication.",
        punishment: "First offence: up to 3 years; Second offence: up to 5 years and fine",
        bailable: true,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 375/376 IPC",
        title: "Rape & Punishment",
        description:
          "A man is said to commit rape if he penetrates, manipulates, or applies his mouth or touches the private parts of a woman under specified circumstances without consent.",
        punishment: "RI not less than 10 years, may extend to life imprisonment and fine",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 498A IPC",
        title: "Cruelty by Husband or Relatives",
        description:
          "Whoever, being the husband or the relative of the husband of a woman, subjects such woman to cruelty shall be punished.",
        punishment: "Imprisonment up to 3 years and fine",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 304B IPC",
        title: "Dowry Death",
        description:
          "Where the death of a woman is caused by burns, bodily injury or under abnormal circumstances within 7 years of marriage, and it is shown that before her death she was subjected to cruelty or harassment for dowry.",
        punishment: "Imprisonment not less than 7 years, may extend to life imprisonment",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
    ],
  },
  {
    id: "children",
    category: "Crimes Against Children",
    icon: <Baby className="h-5 w-5" />,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    description: "POCSO Act and IPC provisions for protection of children",
    sections: [
      {
        section: "POCSO Act - Section 4",
        title: "Penetrative Sexual Assault on Child",
        description:
          "A person commits penetrative sexual assault if he penetrates the vagina, mouth, urethra or anus of a child, or makes the child do so with him or any other person.",
        punishment: "Imprisonment not less than 10 years, may extend to life imprisonment and fine",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "POCSO Act - Section 6",
        title: "Aggravated Penetrative Sexual Assault",
        description:
          "Penetrative sexual assault by police officer, armed forces, public servant, or relative/guardian of child, or when child is below 12 years.",
        punishment: "RI not less than 20 years, may extend to life imprisonment or death, and fine",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "POCSO Act - Section 8",
        title: "Sexual Assault on Child",
        description:
          "Whoever with sexual intent touches the vagina, penis, anus, breast of the child, or makes the child touch such parts of the offender or any other person.",
        punishment: "Imprisonment not less than 3 years, may extend to 5 years and fine",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 363 IPC",
        title: "Kidnapping",
        description:
          "Whoever kidnaps any person from India or from lawful guardianship shall be punished.",
        punishment: "Imprisonment up to 7 years and fine",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 370 IPC",
        title: "Trafficking of Persons",
        description:
          "Whoever recruits, transports, harbours, transfers, or receives a person by using threats, force, coercion, abduction, fraud, deception, abuse of power for the purpose of exploitation.",
        punishment: "RI not less than 7 years, may extend to 10 years and fine",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
    ],
  },
  {
    id: "cyber",
    category: "Cyber Crime",
    icon: <ShieldAlert className="h-5 w-5" />,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    description: "IT Act provisions for cyber offences and digital fraud",
    sections: [
      {
        section: "Section 66 IT Act",
        title: "Computer Related Offences (Hacking)",
        description:
          "If any person, dishonestly or fraudulently, does any act referred to in section 43 (unauthorized access, data theft, virus introduction, etc.).",
        punishment: "Imprisonment up to 3 years, or fine up to ₹5 lakhs, or both",
        bailable: true,
        cognizable: true,
        compoundable: true,
      },
      {
        section: "Section 66C IT Act",
        title: "Identity Theft",
        description:
          "Whoever, fraudulently or dishonestly makes use of the electronic signature, password or any other unique identification feature of any other person.",
        punishment: "Imprisonment up to 3 years and fine up to ₹1 lakh",
        bailable: true,
        cognizable: true,
        compoundable: true,
      },
      {
        section: "Section 66D IT Act",
        title: "Cheating by Personation using Computer",
        description:
          "Whoever by means of any communication device or computer resource cheats by personating (impersonation).",
        punishment: "Imprisonment up to 3 years and fine up to ₹1 lakh",
        bailable: true,
        cognizable: true,
        compoundable: true,
      },
      {
        section: "Section 66E IT Act",
        title: "Violation of Privacy",
        description:
          "Whoever, intentionally or knowingly captures, publishes, or transmits the image of a private area of any person without his or her consent.",
        punishment: "Imprisonment up to 3 years, or fine up to ₹2 lakhs, or both",
        bailable: true,
        cognizable: true,
        compoundable: true,
      },
      {
        section: "Section 67 IT Act",
        title: "Publishing Obscene Material Electronically",
        description:
          "Whoever publishes or transmits or causes to be published any material which is lascivious or appeals to the prurient interest in electronic form.",
        punishment: "First offence: up to 3 years and ₹5 lakhs fine; Second offence: up to 5 years and ₹10 lakhs fine",
        bailable: true,
        cognizable: true,
        compoundable: false,
      },
    ],
  },
  {
    id: "property",
    category: "Property Crimes",
    icon: <Home className="h-5 w-5" />,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    description: "Laws related to trespass, mischief, and property damage",
    sections: [
      {
        section: "Section 425 IPC",
        title: "Mischief",
        description:
          "Whoever with intent to cause, or knowing that he is likely to cause, wrongful loss or damage to the public or any person, causes the destruction of any property, or any such change in any property as destroys or diminishes its value or utility.",
        punishment: "Imprisonment up to 3 months, or fine, or both",
        bailable: true,
        cognizable: false,
        compoundable: true,
      },
      {
        section: "Section 427 IPC",
        title: "Mischief causing damage of ₹50 or more",
        description:
          "Whoever commits mischief and thereby causes loss or damage to the amount of fifty rupees or upwards.",
        punishment: "Imprisonment up to 2 years, or fine, or both",
        bailable: true,
        cognizable: true,
        compoundable: true,
      },
      {
        section: "Section 441 IPC",
        title: "Criminal Trespass",
        description:
          "Whoever enters into or upon property in the possession of another with intent to commit an offence or to intimidate, insult or annoy any person in possession of such property.",
        punishment: "Imprisonment up to 3 months, or fine up to ₹500, or both",
        bailable: true,
        cognizable: false,
        compoundable: true,
      },
      {
        section: "Section 447 IPC",
        title: "Punishment for Criminal Trespass",
        description:
          "Whoever commits criminal trespass shall be punished with imprisonment of either description.",
        punishment: "Imprisonment up to 3 months, or fine up to ₹500, or both",
        bailable: true,
        cognizable: false,
        compoundable: true,
      },
      {
        section: "Section 448 IPC",
        title: "Punishment for House-Trespass",
        description:
          "Whoever commits house-trespass shall be punished with imprisonment which may extend to one year, or with fine which may extend to one thousand rupees, or with both.",
        punishment: "Imprisonment up to 1 year, or fine up to ₹1000, or both",
        bailable: true,
        cognizable: true,
        compoundable: true,
      },
    ],
  },
  {
    id: "fraud",
    category: "Fraud & Cheating",
    icon: <Banknote className="h-5 w-5" />,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    description: "Laws related to cheating, fraud, forgery, and corruption",
    sections: [
      {
        section: "Section 415 IPC",
        title: "Cheating",
        description:
          "Whoever, by deceiving any person, fraudulently or dishonestly induces the person so deceived to deliver any property to any person, or to consent that any person shall retain any property.",
        punishment: "Imprisonment up to 1 year, or fine, or both",
        bailable: true,
        cognizable: false,
        compoundable: true,
      },
      {
        section: "Section 420 IPC",
        title: "Cheating and dishonestly inducing delivery of property",
        description:
          "Whoever cheats and thereby dishonestly induces the person deceived to deliver any property to any person, or to make, alter or destroy the whole or any part of a valuable security.",
        punishment: "Imprisonment up to 7 years and fine",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 463 IPC",
        title: "Forgery",
        description:
          "Whoever makes any false document or false electronic record with intent to cause damage or injury, to the public or to any person, or to support any claim or title.",
        punishment: "Imprisonment up to 2 years, or fine, or both",
        bailable: true,
        cognizable: false,
        compoundable: false,
      },
      {
        section: "Section 468 IPC",
        title: "Forgery for purpose of cheating",
        description:
          "Whoever commits forgery, intending that the document or electronic record forged shall be used for the purpose of cheating.",
        punishment: "Imprisonment up to 7 years and fine",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 471 IPC",
        title: "Using as genuine a forged document",
        description:
          "Whoever fraudulently or dishonestly uses as genuine any document or electronic record which he knows or has reason to believe to be a forged document.",
        punishment: "Same as if he had forged such document",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
    ],
  },
  {
    id: "drugs",
    category: "Narcotics & Drugs",
    icon: <Pill className="h-5 w-5" />,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    description: "NDPS Act provisions for drug-related offences",
    sections: [
      {
        section: "Section 20 NDPS Act",
        title: "Cannabis (Ganja) Possession/Use",
        description:
          "Production, manufacture, possession, sale, purchase, transport, import inter-State, export inter-State, use of cannabis.",
        punishment:
          "Small qty: RI up to 1 year or fine up to ₹10,000; Commercial qty: RI 10–20 years and fine ₹1–2 lakhs",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 21 NDPS Act",
        title: "Manufactured Drugs (Heroin, Cocaine, etc.)",
        description:
          "Contravention in relation to manufactured drugs and preparations. Possession, sale, purchase, transport of manufactured narcotic drugs.",
        punishment:
          "Small qty: RI up to 1 year or fine up to ₹10,000; Commercial qty: RI 10–20 years and fine ₹1–2 lakhs",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 22 NDPS Act",
        title: "Psychotropic Substances",
        description:
          "Contravention in relation to psychotropic substances. Possession, sale, purchase, transport of psychotropic substances.",
        punishment:
          "Small qty: RI up to 1 year or fine up to ₹10,000; Commercial qty: RI 10–20 years and fine ₹1–2 lakhs",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 27 NDPS Act",
        title: "Consumption of Narcotic Drug or Psychotropic Substance",
        description:
          "Whoever consumes any narcotic drug or psychotropic substance shall be punishable.",
        punishment:
          "Cocaine/Morphine/Heroin: RI up to 1 year or fine up to ₹20,000; Others: up to 6 months or fine up to ₹10,000",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 29 NDPS Act",
        title: "Abetment and Criminal Conspiracy",
        description:
          "Whoever abets, or is a party to a criminal conspiracy to commit an offence punishable under this Act.",
        punishment: "Same as the offence abetted or conspired",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
    ],
  },
  {
    id: "public",
    category: "Public Order & Safety",
    icon: <Siren className="h-5 w-5" />,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    description: "Laws related to rioting, public nuisance, and unlawful assembly",
    sections: [
      {
        section: "Section 141 IPC",
        title: "Unlawful Assembly",
        description:
          "An assembly of five or more persons is designated an unlawful assembly if the common object of the persons composing that assembly is to commit any offence.",
        punishment: "Imprisonment up to 6 months, or fine, or both",
        bailable: true,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 147 IPC",
        title: "Rioting",
        description:
          "Whenever force or violence is used by an unlawful assembly, or by any member thereof, every member of such assembly is guilty of the offence of rioting.",
        punishment: "Imprisonment up to 2 years, or fine, or both",
        bailable: true,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 148 IPC",
        title: "Rioting Armed with Deadly Weapon",
        description:
          "Whoever is guilty of rioting, being armed with a deadly weapon or with anything which, used as a weapon of offence, is likely to cause death.",
        punishment: "Imprisonment up to 3 years, or fine, or both",
        bailable: true,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 268 IPC",
        title: "Public Nuisance",
        description:
          "A person is guilty of a public nuisance who does any act or is guilty of an illegal omission which causes any common injury, danger or annoyance to the public.",
        punishment: "Fine up to ₹200",
        bailable: true,
        cognizable: false,
        compoundable: false,
      },
      {
        section: "Section 506 IPC",
        title: "Criminal Intimidation",
        description:
          "Whoever commits criminal intimidation shall be punished with imprisonment which may extend to two years, or with fine, or with both.",
        punishment:
          "Imprisonment up to 2 years, or fine, or both; If threat to cause death or grievous hurt: up to 7 years",
        bailable: true,
        cognizable: false,
        compoundable: true,
      },
    ],
  },
  {
    id: "motor",
    category: "Motor Vehicle Offences",
    icon: <Car className="h-5 w-5" />,
    color: "text-sky-500",
    bgColor: "bg-sky-500/10",
    description: "Motor Vehicles Act provisions for traffic and vehicle offences",
    sections: [
      {
        section: "Section 184 MV Act",
        title: "Dangerous / Rash Driving",
        description:
          "Whoever drives a motor vehicle at a speed or in a manner which is dangerous to the public.",
        punishment:
          "First offence: imprisonment up to 1 year or fine up to ₹5,000; Second offence: up to 2 years or fine up to ₹10,000",
        bailable: true,
        cognizable: true,
        compoundable: true,
      },
      {
        section: "Section 185 MV Act",
        title: "Driving Under Influence of Alcohol/Drugs",
        description:
          "Whoever drives a motor vehicle while under the influence of drink or drug to such an extent as to be incapable of exercising proper control.",
        punishment:
          "First offence: imprisonment up to 6 months or fine up to ₹10,000; Second offence within 3 years: up to 2 years or fine up to ₹15,000",
        bailable: true,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 187 MV Act",
        title: "Hit and Run",
        description:
          "Whoever fails to stop after an accident and report to the nearest police station or magistrate within a reasonable time.",
        punishment: "Imprisonment up to 6 months, or fine up to ₹5,000, or both",
        bailable: true,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 189 MV Act",
        title: "Racing / Speed Trials",
        description:
          "Whoever without the written consent of the State Government permits or takes part in a race or speed trial of any kind.",
        punishment: "Imprisonment up to 1 month, or fine up to ₹500, or both",
        bailable: true,
        cognizable: true,
        compoundable: true,
      },
      {
        section: "Section 192A MV Act",
        title: "Using vehicle without permit",
        description:
          "Whoever drives a motor vehicle or causes or allows a motor vehicle to be used in contravention of the requirement of permit.",
        punishment: "First offence: fine up to ₹5,000; Second offence: imprisonment up to 1 year or fine up to ₹10,000",
        bailable: true,
        cognizable: true,
        compoundable: true,
      },
    ],
  },
  {
    id: "explosive",
    category: "Explosives & Arms",
    icon: <Bomb className="h-5 w-5" />,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    description: "Arms Act and Explosive Substances Act provisions",
    sections: [
      {
        section: "Section 25 Arms Act",
        title: "Possession of Arms without Licence",
        description:
          "Whoever acquires, has in his possession, or carries any firearm or ammunition in contravention of section 3.",
        punishment: "Imprisonment not less than 1 year, may extend to 3 years and fine",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 27 Arms Act",
        title: "Using Arms to commit offence",
        description:
          "Whoever uses any prohibited arms or prohibited ammunition or does any act in contravention of section 7.",
        punishment: "Imprisonment not less than 3 years, may extend to 7 years and fine",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 4 Explosive Substances Act",
        title: "Attempt to cause explosion or making/keeping explosive",
        description:
          "Any person who makes or knowingly has in his possession or under his control any explosive substance with intent to endanger life or property.",
        punishment: "Imprisonment up to 14 years",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 5 Explosive Substances Act",
        title: "Making or possessing explosives under suspicious circumstances",
        description:
          "Any person who makes or knowingly has in his possession or under his control any explosive substance, under such circumstances as to give rise to a reasonable suspicion.",
        punishment: "Imprisonment up to 10 years",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
    ],
  },
  {
    id: "corruption",
    category: "Corruption & Bribery",
    icon: <Landmark className="h-5 w-5" />,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    description: "Prevention of Corruption Act provisions",
    sections: [
      {
        section: "Section 7 PC Act",
        title: "Public Servant Taking Gratification",
        description:
          "Any public servant who obtains or accepts any undue advantage with intention to perform or cause performance of public duty improperly or dishonestly.",
        punishment: "Imprisonment not less than 3 years, may extend to 7 years and fine",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 8 PC Act",
        title: "Giving Bribe to Public Servant",
        description:
          "Any person who gives or promises to give an undue advantage to a public servant or to any other person, as a reward for improper performance.",
        punishment: "Imprisonment up to 7 years, or fine, or both",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 13 PC Act",
        title: "Criminal Misconduct by Public Servant",
        description:
          "A public servant commits criminal misconduct if he dishonestly or fraudulently misappropriates or otherwise converts for his own use any property entrusted to him.",
        punishment: "Imprisonment not less than 4 years, may extend to 10 years and fine",
        bailable: false,
        cognizable: true,
        compoundable: false,
      },
      {
        section: "Section 168 IPC",
        title: "Public Servant unlawfully engaging in trade",
        description:
          "Whoever being a public servant engages in trade in contravention of legal direction.",
        punishment: "Simple imprisonment up to 1 year, or fine, or both",
        bailable: true,
        cognizable: false,
        compoundable: false,
      },
    ],
  },
];

export default function Rules() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  // Toggle category expansion
  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Toggle individual section detail
  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  };

  // Filter categories and sections
  const filteredCategories = useMemo(() => {
    let categories = lawCategories;

    if (categoryFilter !== "ALL") {
      categories = categories.filter((c) => c.id === categoryFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      categories = categories
        .map((cat) => ({
          ...cat,
          sections: cat.sections.filter(
            (s) =>
              s.section.toLowerCase().includes(query) ||
              s.title.toLowerCase().includes(query) ||
              s.description.toLowerCase().includes(query) ||
              s.punishment.toLowerCase().includes(query)
          ),
        }))
        .filter((cat) => cat.sections.length > 0);
    }

    return categories;
  }, [searchQuery, categoryFilter]);

  const totalSections = filteredCategories.reduce(
    (acc, cat) => acc + cat.sections.length,
    0
  );

  return (
    <DashboardLayout title="Rules & Laws Reference" navItems={navItems}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* ── Header Info ── */}
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/50">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Quick Reference Guide
                </h3>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                  This is a reference guide for Indian Penal Code (IPC),
                  special laws (NDPS, POCSO, IT Act, Arms Act, MV Act, PC Act)
                  and their provisions. Use search or filter to quickly find
                  the applicable section for any offence.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Search & Filter ── */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by section, title, description, or punishment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {lawCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <p>
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {totalSections}
                </span>{" "}
                sections across{" "}
                <span className="font-semibold text-foreground">
                  {filteredCategories.length}
                </span>{" "}
                categories
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setExpandedCategories(
                      expandedCategories.size === filteredCategories.length
                        ? new Set()
                        : new Set(filteredCategories.map((c) => c.id))
                    )
                  }
                >
                  {expandedCategories.size === filteredCategories.length
                    ? "Collapse All"
                    : "Expand All"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Empty State ── */}
        {filteredCategories.length === 0 && (
          <Card>
            <CardContent className="text-center py-10">
              <Scale className="h-10 w-10 mx-auto mb-2 opacity-50 text-muted-foreground" />
              <p className="text-muted-foreground text-lg font-medium">
                No matching laws found
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Try adjusting your search or filter.
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── Category Cards ── */}
        {filteredCategories.map((category, catIndex) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: catIndex * 0.05 }}
          >
            <Card className="overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b"
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2.5 ${category.bgColor}`}>
                    <span className={category.color}>{category.icon}</span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground">
                      {category.category}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {category.description}
                    </p>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {category.sections.length} Sections
                  </Badge>
                </div>
                {expandedCategories.has(category.id) ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
              </button>

              {/* Sections List */}
              <AnimatePresence>
                {expandedCategories.has(category.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="divide-y">
                      {category.sections.map((section, secIndex) => {
                        const sectionKey = `${category.id}-${section.section}`;
                        const isExpanded = expandedSections.has(sectionKey);

                        return (
                          <motion.div
                            key={sectionKey}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              duration: 0.2,
                              delay: secIndex * 0.03,
                            }}
                          >
                            {/* Section Row */}
                            <button
                              onClick={() => toggleSection(sectionKey)}
                              className="w-full text-left px-6 py-4 hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-semibold text-foreground">
                                      {section.section}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      —
                                    </span>
                                    <span className="text-sm font-medium text-foreground">
                                      {section.title}
                                    </span>
                                  </div>

                                  {/* Badges */}
                                  <div className="flex gap-2 mt-2 flex-wrap">
                                    <Badge
                                      variant={
                                        section.bailable
                                          ? "outline"
                                          : "destructive"
                                      }
                                      className="text-xs"
                                    >
                                      {section.bailable
                                        ? "Bailable"
                                        : "Non-Bailable"}
                                    </Badge>
                                    <Badge
                                      variant={
                                        section.cognizable
                                          ? "default"
                                          : "secondary"
                                      }
                                      className="text-xs"
                                    >
                                      {section.cognizable
                                        ? "Cognizable"
                                        : "Non-Cognizable"}
                                    </Badge>
                                    {section.compoundable && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs border-green-300 text-green-700 dark:border-green-700 dark:text-green-400"
                                      >
                                        Compoundable
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                                )}
                              </div>
                            </button>

                            {/* Expanded Detail */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-6 pb-4 ml-0 border-l-4 border-primary/30 mx-6 pl-4 space-y-3">
                                    {/* Description */}
                                    <div>
                                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                                        Description
                                      </p>
                                      <p className="text-sm text-foreground leading-relaxed">
                                        {section.description}
                                      </p>
                                    </div>

                                    {/* Punishment */}
                                    <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-3">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Gavel className="h-4 w-4 text-red-600 dark:text-red-400" />
                                        <p className="text-xs font-semibold uppercase text-red-700 dark:text-red-400">
                                          Punishment
                                        </p>
                                      </div>
                                      <p className="text-sm font-medium text-red-800 dark:text-red-300">
                                        {section.punishment}
                                      </p>
                                    </div>

                                    {/* Properties Grid */}
                                    <div className="grid grid-cols-3 gap-3">
                                      <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                                        <p className="text-xs text-muted-foreground mb-1">
                                          Bail Status
                                        </p>
                                        <p
                                          className={`text-sm font-semibold ${section.bailable ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                                        >
                                          {section.bailable
                                            ? "✓ Bailable"
                                            : "✗ Non-Bailable"}
                                        </p>
                                      </div>
                                      <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                                        <p className="text-xs text-muted-foreground mb-1">
                                          Cognizance
                                        </p>
                                        <p
                                          className={`text-sm font-semibold ${section.cognizable ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"}`}
                                        >
                                          {section.cognizable
                                            ? "✓ Cognizable"
                                            : "✗ Non-Cognizable"}
                                        </p>
                                      </div>
                                      <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                                        <p className="text-xs text-muted-foreground mb-1">
                                          Compoundable
                                        </p>
                                        <p
                                          className={`text-sm font-semibold ${section.compoundable ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}`}
                                        >
                                          {section.compoundable
                                            ? "✓ Yes"
                                            : "✗ No"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ))}

        {/* ── Disclaimer ── */}
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/50">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                  Disclaimer
                </h3>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  This is a quick reference guide only. Always refer to the
                  latest official gazette, amendments, and consult the legal
                  department before taking action. Some sections may have been
                  amended or replaced under the Bharatiya Nyaya Sanhita (BNS),
                  2023. The punishments mentioned are indicative and may vary
                  based on judicial discretion and case circumstances.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}