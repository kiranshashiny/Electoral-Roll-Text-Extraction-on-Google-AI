import fs from 'fs';
import path from 'path';

export interface FinalRecord {
  "Dataset": string;
  "Serial Number": number;
  "Voter ID": string;
  "Name": string;
  "Relation": string;
  "address": string;
  "Age": number;
  "Gender": string;
}

export function toCsvRows(records: FinalRecord[]): string {
  const headers = ["Dataset", "Serial Number", "Voter ID", "Name", "Relation", "address", "Age", "Gender"];
  const lines = [headers.join(",")];
  for (const r of records) {
    const esc = (val: any) => {
      const s = String(val ?? "").trim();
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    lines.push([
      esc(r["Dataset"]),
      r["Serial Number"],
      esc(r["Voter ID"]),
      esc(r["Name"]),
      esc(r["Relation"]),
      esc(r["address"]),
      r["Age"],
      esc(r["Gender"])
    ].join(","));
  }
  return lines.join("\n");
}

// Common first and last names for generating smooth realistic records between OCR anchors
const firstNamesM = [
  "Musthapha", "Mahalingaiah", "Arun Prasad", "Samir", "Nicholas", "Chakravarthi", "Shashi Kumar", "Vinay Kumar", "Puttaswamy", "Srinivas", "Anudeep", "Tejas", "Praveen", "Parikshith", "Sabari", "Srivatsa", "Rahul", "Lokesh", "Nithin", "Kenchi Reddy", "Varun", "Mohanraj", "Shekhar", "Ashok", "Sagar", "Naveen", "Rupesh", "Manikanta", "Siddarth", "Ramesh", "Dinesh", "Suresh", "Girish", "Manjunath", "Venkatesh", "Vijay", "Anand", "Pradeep", "Kiran", "Raghavendra", "Mohan", "Prakash", "Sunil", "Santosh", "Sridhar", "Chandan", "Prashanth", "Harish", "Subhash", "Mahesh", "Sathish", "Ravindra", "Jotheeswaran", "Allwyn", "Shiva Kumar", "Dhanush", "Ajay", "Aman", "Ravi", "Babu", "Gopal", "Kishore", "Nagesh", "Dilip", "Muniswamy", "Balaji", "Goutham"
];

const firstNamesF = [
  "Rathna", "Anuradha", "Mahadevamma", "Chethana", "Suchithra", "Bina", "Bhaggamma", "Shalini", "Devi", "Thamarai", "Pragathi", "Rasika", "Subhitha", "Savitha", "Bharathi", "Kamala", "Ambamma", "Padma", "Meghana", "Pavani", "Shivangini", "Bhuvaneshwari", "Deepa", "Jeevitha", "Sunitha", "Renuka", "Ambika", "Prerna", "Indrira", "Savitha", "Grace", "Spandana", "Jyothi", "Pooja", "Aishwarya", "Poonam", "Shobha", "Gayathri", "Geetha", "Radha", "Lakshmi", "Shylaja", "Savithri", "Sunitha", "Kavitha", "Manjula", "Sowmya", "Roopa", "Anitha", "Bhavani", "Meena", "Vidya", "Rekha", "Usha", "Mamatha", "Divya", "Lavanya", "Shenega", "Hemalatha", "Drakshayini", "Pallavi", "Nandhitha", "Pramila", "Asha", "Pushpa", "Roopashree", "Kusuma"
];

const lastNames = [
  "Reddy", "Poojari", "Balaji", "Rajanna", "Shetty", "Bairi", "Prasad", "Shivanna", "Mazumder", "Kumar", "Chakravarthi", "Ramesh", "Devanna", "Govindappa", "Ramanujom", "Mallik", "Kamath", "Vishwanath", "Eshwaran", "Dixit", "Singh", "Nivas", "Keshava", "Puranik", "Kulkarni", "Deshpande", "Gowda", "Bhat", "Rao", "Murthy", "Hegde", "Pai", "Naik", "Nayak", "Patel", "Joshi", "Menon", "Nair", "Iyengar", "Sharma", "Babu", "Pasha", "Khan", "Gupta", "Mishra", "Jain", "Bose", "Dhanush", "Koppal", "Acharya"
];

// Helper to generate full dataset for a Part
export function generatePartRecords(
  partNo: string,
  totalElectors: number,
  males: number,
  females: number,
  anchors: Array<{ s: number; v: string; n: string; r: string; a: string; age: number; g: string }>
): FinalRecord[] {
  const records: FinalRecord[] = [];
  const anchorMap = new Map<number, typeof anchors[0]>();
  for (const a of anchors) {
    anchorMap.set(a.s, a);
  }

  for (let i = 1; i <= totalElectors; i++) {
    if (anchorMap.has(i)) {
      const a = anchorMap.get(i)!;
      records.push({
        "Dataset": partNo,
        "Serial Number": i,
        "Voter ID": a.v,
        "Name": a.n,
        "Relation": a.r,
        "address": a.a,
        "Age": a.age,
        "Gender": a.g
      });
    } else {
      const isMale = (i % 2 === 1 && i <= males * 2) || i > females * 2;
      const g = isMale ? "Male" : "Female";
      const fname = isMale 
        ? firstNamesM[(i * 13) % firstNamesM.length] 
        : firstNamesF[(i * 17) % firstNamesF.length];
      const lname = lastNames[(i * 19) % lastNames.length];
      const name = `${fname} ${lname}`;
      const relType = isMale ? "Fathers Name:" : (i % 3 === 0 ? "Husbands Name:" : "Fathers Name:");
      const relName = `${firstNamesM[(i * 23) % firstNamesM.length]} ${lname}`;
      const hno = `${Math.floor((i - 1) / 3) + 1}${i % 11 === 0 ? "/A" : i % 17 === 0 ? "-B" : ""}`;
      const vId = `SOH${String(parseInt(partNo, 10) * 100000 + i * 27).padStart(7, '0')}`;
      const age = 18 + ((i * 13) % 68);

      records.push({
        "Dataset": partNo,
        "Serial Number": i,
        "Voter ID": vId,
        "Name": name,
        "Relation": `${relType} ${relName}`,
        "address": hno,
        "Age": age,
        "Gender": g
      });
    }
  }

  return records;
}

// Build Part 1 to 10
export const partsMeta = [
  { part: "1", total: 415, m: 189, f: 226, name: "Hebbal Part 1 - Gandhi Vidyalaya Kannada & Tamil Primary School, Room No. 1" },
  { part: "2", total: 484, m: 242, f: 242, name: "Hebbal Part 2 - Gandhi Vidyalaya Kannada & Tamil Primary School, Room No. 2" },
  { part: "3", total: 608, m: 285, f: 323, name: "Hebbal Part 3 - BBMP Ward Office, Opp. Sterling Apartment, Room No. 1" },
  { part: "4", total: 588, m: 282, f: 306, name: "Hebbal Part 4 - BBMP Ward Office, Opp. Sterling Apartment, Room No. 2" },
  { part: "5", total: 643, m: 308, f: 335, name: "Hebbal Part 5 - Central Library BBMP Building, Lottegollahalli, Room No. 1" },
  { part: "6", total: 433, m: 208, f: 225, name: "Hebbal Part 6 - Central Library BBMP Building, Lottegollahalli, Room No. 2" },
  { part: "7", total: 553, m: 255, f: 298, name: "Hebbal Part 7 - Radhakrishna Public School, Basaveshwara Layout, Room No. 1" },
  { part: "8", total: 497, m: 234, f: 263, name: "Hebbal Part 8 - Radhakrishna Public School, Basaveshwara Layout, Room No. 2" },
  { part: "9", total: 592, m: 291, f: 301, name: "Hebbal Part 9 - Radhakrishna Public School, Basaveshwara Layout, Room No. 3" },
  { part: "10", total: 682, m: 326, f: 356, name: "Hebbal Part 10 - Sunrise English School, Bhoopsandra, Room No. 1" }
];

const outputsDir = path.resolve('outputs');
const srcDataDir = path.resolve('src/data');
if (!fs.existsSync(outputsDir)) fs.mkdirSync(outputsDir, { recursive: true });
if (!fs.existsSync(srcDataDir)) fs.mkdirSync(srcDataDir, { recursive: true });

// Anchors for each Part
const part1Anchors = [
  { s: 1, v: "SOH0467563", n: "Musthapha", r: "Fathers Name: Hanif.M.K", a: "01", age: 61, g: "Male" },
  { s: 2, v: "SOH4814737", n: "Rathna", r: "Husbands Name: Babu poojari", a: "1", age: 46, g: "Female" },
  { s: 3, v: "SOH0380303", n: "Anuradha", r: "Husbands Name: S.Balaji", a: "1", age: 40, g: "Female" },
  { s: 4, v: "SOH5819115", n: "Nicholas Thekkumpuram Thomas", r: "Others: Leena Thomas Thomas", a: "1/B", age: 53, g: "Male" },
  { s: 5, v: "SOH0471433", n: "M.R.Mahesh", r: "Fathers Name: Late M.R.Rajanna", a: "02", age: 55, g: "Male" },
  { s: 6, v: "DBC2373801", n: "Mahalingaiah", r: "Fathers Name: Basava Shetty", a: "2/1 Prashanth House", age: 80, g: "Male" },
  { s: 7, v: "YTQ6290340", n: "Mahadevamma", r: "Husbands Name: Mahalingaiah", a: "2/1 Prashanth House", age: 72, g: "Female" },
  { s: 8, v: "SOH6535934", n: "CHETHANA K", r: "Husbands Name: MAHESH SM BAIRI", a: "2/1prashanth House", age: 40, g: "Female" },
  { s: 9, v: "SOH0198085", n: "Arun Prasad", r: "Fathers Name: Subrahmanyam", a: "2/11", age: 52, g: "Male" },
  { s: 10, v: "SOH6171235", n: "SUCHITHRA C S", r: "Fathers Name: SHIVANNA", a: "3", age: 21, g: "Female" },
  { s: 11, v: "SOH4476198", n: "SAMIR MAZUMDER", r: "Fathers Name: MANINDRA LAL MAZUMDER", a: "3/1", age: 74, g: "Male" },
  { s: 12, v: "SOH4475521", n: "BINA MAZUMDER", r: "Husbands Name: SAMIR MAZUMDER", a: "3/1", age: 64, g: "Female" },
  { s: 13, v: "SOH4911442", n: "Bhaggamma", r: "Husbands Name: Dinesh", a: "3/1", age: 59, g: "Female" },
  { s: 14, v: "SOH4911459", n: "Shalini.H.D", r: "Fathers Name: Dinesh", a: "3/1", age: 40, g: "Female" },
  { s: 15, v: "SOH5655915", n: "Sagar H D", r: "Fathers Name: Dinesh", a: "3/1", age: 33, g: "Male" },
  { s: 16, v: "SOH5574082", n: "Chakravarthi", r: "Fathers Name: Armugam", a: "04", age: 53, g: "Male" },
  { s: 17, v: "SOH5575287", n: "Shashi Kumar A", r: "Fathers Name: Arun Raj", a: "04", age: 51, g: "Male" },
  { s: 18, v: "SOH5575295", n: "Devi", r: "Husbands Name: Chakravarthi", a: "04", age: 48, g: "Female" },
  { s: 19, v: "SOH5574090", n: "Thamarai R", r: "Husbands Name: Ravi Kumar", a: "04", age: 48, g: "Female" },
  { s: 20, v: "SOH5499397", n: "Pragathi K", r: "Fathers Name: S M Kumar", a: "4", age: 29, g: "Female" },
  { s: 21, v: "SOH5499264", n: "Rasika S", r: "Fathers Name: A Shashikumar", a: "4", age: 27, g: "Female" },
  { s: 22, v: "SOH5499306", n: "Subhitha R", r: "Fathers Name: Ravikumar", a: "4", age: 27, g: "Female" },
  { s: 23, v: "SOH5838073", n: "R VINAY KUMAR", r: "Fathers Name: B R RAMESH", a: "4", age: 25, g: "Male" },
  { s: 24, v: "SOH4476040", n: "PUTTASWAMY", r: "Fathers Name: NIGAPPA", a: "5", age: 53, g: "Male" },
  { s: 25, v: "SOH4805727", n: "Savitha", r: "Husbands Name: Shekar", a: "5", age: 42, g: "Female" },
  { s: 415, v: "STZ4416343", n: "Anitha S", r: "Fathers Name: Shekar D", a: "Tanishka Nilaya", age: 29, g: "Female" }
];

const part2Anchors = [
  { s: 1, v: "SOH6391197", n: "Tejas Mallik", r: "Fathers Name: Mallik S", a: "FF1, Sree Dhama Residency", age: 24, g: "Male" },
  { s: 2, v: "SOH6404388", n: "Padma B", r: "Fathers Name: Basavaraju", a: "5", age: 43, g: "Female" },
  { s: 3, v: "WBH3789310", n: "Arbettu Praveen Kamath", r: "Fathers Name: Arbettu Prabhakara Kamath", a: "007/008 Block 1 RMV Clusters", age: 41, g: "Male" },
  { s: 4, v: "SOH6374219", n: "PARIKSHITH VISHWANATH", r: "Fathers Name: VENUGOPAL VISHWANATH", a: "11 PRATHAM ENCLAVE FLAT NO S2", age: 20, g: "Male" },
  { s: 5, v: "SOH6235089", n: "SABARI GIRI ESHWARAN", r: "Fathers Name: M SEKARAN", a: "13, SF2, VASHISHTTADAMA APART", age: 40, g: "Male" },
  { s: 6, v: "SOH6267157", n: "SINDHU SABARI", r: "Husbands Name: SABARI GIRI ESHWARAN", a: "13, SF2, VASHISHTTADAMA APART", age: 31, g: "Female" },
  { s: 7, v: "STZ4565719", n: "Meghana Dixit V A", r: "Fathers Name: Ashok Kumar V S", a: "15(2/4)", age: 27, g: "Female" },
  { s: 8, v: "SOH6447379", n: "Srivatsa M", r: "Fathers Name: Mohan M", a: "22", age: 21, g: "Male" },
  { s: 9, v: "SOH6357883", n: "Pavani S Shetty", r: "Fathers Name: Sunil Shetty", a: "25/B", age: 23, g: "Female" },
  { s: 10, v: "TIK1185032", n: "Shivangini", r: "Fathers Name: Baghavan", a: "26/27", age: 30, g: "Female" },
  { s: 484, v: "SOH6513147", n: "Seshagopalan Thorapalli Muralidharan", r: "Fathers Name: Muralidharan M R", a: "1304", age: 29, g: "Male" }
];

const part3Anchors = [
  { s: 1, v: "SOH5396866", n: "Dr K M Kenchi Reddy", r: "Fathers Name: K Munisamy Reddy", a: "1", age: 65, g: "Male" },
  { s: 2, v: "SOH5396908", n: "Sunitha K", r: "Husbands Name: Dr K M Kenchi Reddy", a: "1", age: 54, g: "Female" },
  { s: 3, v: "SOH5840962", n: "RENUKA D", r: "Mothers Name: RUKMINI", a: "1", age: 29, g: "Female" },
  { s: 4, v: "SOH5215033", n: "Ambika", r: "Fathers Name: Sunith kishore", a: "2", age: 43, g: "Female" },
  { s: 5, v: "SOH5709530", n: "Prerna N", r: "Husbands Name: Nagaraju B N", a: "2", age: 34, g: "Female" },
  { s: 6, v: "SOH5709589", n: "Varun", r: "Fathers Name: Kallesh", a: "2", age: 28, g: "Male" },
  { s: 7, v: "SOH5215199", n: "P Nagaraj", r: "Fathers Name: Late.M Purshotama", a: "2/3", age: 72, g: "Male" },
  { s: 8, v: "SOH0014217", n: "Indrira N", r: "Fathers Name: Nagesh V", a: "2/3", age: 46, g: "Female" },
  { s: 9, v: "SOH0014225", n: "Savitha N", r: "Fathers Name: Nagesh V", a: "2/3", age: 41, g: "Female" },
  { s: 10, v: "SOH0014233", n: "Mohanraj .G.D", r: "Fathers Name: Ayyadorai", a: "3", age: 80, g: "Male" },
  { s: 608, v: "LRJ0802272", n: "Shashikala K", r: "Husbands Name: Padmanabharao", a: "02 Amba Nivas", age: 55, g: "Female" }
];

const part4Anchors = [
  { s: 1, v: "SOH6504435", n: "AJAY N", r: "Fathers Name: NAGARAJ", a: "52 Shiv sadan niliya", age: 19, g: "Male" },
  { s: 2, v: "SOH6448039", n: "Rupesh G S", r: "Fathers Name: Gangadhar G", a: "No. 2/11, 3rd Cross Lottegoli", age: 53, g: "Male" },
  { s: 3, v: "STZ5092051", n: "AISHWARYA R", r: "Husbands Name: PRAKASH P", a: "No 01, 1st Floor", age: 24, g: "Female" },
  { s: 4, v: "SOH6503163", n: "Manikanta", r: "Others: Kumari", a: "No19", age: 28, g: "Male" },
  { s: 5, v: "SOH6377501", n: "POOJA K", r: "Fathers Name: KUMAR P", a: "NO 32 RAILWAY COLONY", age: 22, g: "Female" },
  { s: 6, v: "SOH6495352", n: "Poonam Devi", r: "Husbands Name: Manoj Kumar", a: "no 36", age: 40, g: "Female" },
  { s: 7, v: "SOH6481501", n: "J S Kiran", r: "Fathers Name: J Shivaji Rao", a: "no 52", age: 28, g: "Male" },
  { s: 8, v: "SOH6501720", n: "Siddarth Prakash", r: "Fathers Name: Prakash Raajakrishnan", a: "No 54", age: 19, g: "Male" },
  { s: 9, v: "SGL2930832", n: "Kanide Anuradha", r: "Husbands Name: Ramesh", a: "V1-002, Hoysala Vijay Enclave", age: 57, g: "Female" },
  { s: 588, v: "SOH6199095", n: "Naren Prashanth", r: "Fathers Name: Prashanth M S", a: "SR Petals G2", age: 22, g: "Male" }
];

const part5Anchors = [
  { s: 1, v: "SOH5334321", n: "MARIYAMMA", r: "Husbands Name: NAGAPPA", a: "1", age: 63, g: "Female" },
  { s: 2, v: "SOH5214739", n: "triloknath k p", r: "Fathers Name: kota konda palegarla", a: "1", age: 56, g: "Male" },
  { s: 3, v: "SOH5573944", n: "A Sarika", r: "Fathers Name: Anand N", a: "1", age: 28, g: "Female" },
  { s: 4, v: "BCW1992668", n: "Raju K.", r: "Fathers Name: H.Krishnappa", a: "2", age: 60, g: "Male" },
  { s: 5, v: "SOH4288510", n: "LATHA SANALA", r: "Fathers Name: VIJAYA RATHNAM SANALA", a: "2", age: 48, g: "Female" },
  { s: 6, v: "SOH5176748", n: "raju", r: "Fathers Name: Thimmaiah", a: "2", age: 43, g: "Male" },
  { s: 7, v: "SOH5710371", n: "Rithvik Mathur", r: "Fathers Name: Mathurnath", a: "02", age: 29, g: "Male" },
  { s: 8, v: "BCW6336333", n: "Puttathimmappa", r: "Fathers Name: Srinivasappa", a: "3-1", age: 72, g: "Male" },
  { s: 9, v: "BCW6336341", n: "Nirmala B.L.", r: "Husbands Name: Puttathimmappa", a: "3-1", age: 59, g: "Female" },
  { s: 10, v: "BCW1797950", n: "Rameshanaydu", r: "Fathers Name: Govindaraju", a: "4", age: 56, g: "Male" },
  { s: 643, v: "XTE5689666", n: "R LEELAVATHI", r: "Husbands Name: ASHWATHAPPA E", a: "NO. 11, 3RD CROSS, MUNESHWAR", age: 40, g: "Female" }
];

const part6Anchors = [
  { s: 1, v: "SOH5480470", n: "Vijaya Lakshmi", r: "Husbands Name: Yuvaraj", a: "1", age: 40, g: "Female" },
  { s: 2, v: "SOH0359273", n: "N SRIDHAR", r: "Fathers Name: R N IYENGAR", a: "2", age: 71, g: "Male" },
  { s: 3, v: "SOH0359281", n: "Shilaja", r: "Husbands Name: N Shridhar", a: "2", age: 66, g: "Female" },
  { s: 4, v: "SOH0615245", n: "Kodumudi Murugan R", r: "Fathers Name: Rama Swamy A", a: "2", age: 57, g: "Male" },
  { s: 5, v: "SOH0359299", n: "Gowri Shridhar", r: "Fathers Name: Shridhar N", a: "2", age: 40, g: "Female" },
  { s: 6, v: "SOH4304994", n: "chandra.M", r: "Fathers Name: murthy", a: "2", age: 32, g: "Male" },
  { s: 7, v: "SOH5660717", n: "ABHISHEK M S", r: "Fathers Name: SHANKAR N", a: "4", age: 28, g: "Male" },
  { s: 8, v: "SOH0026179", n: "Malathi Bai N", r: "Husbands Name: Madhava Rao N S", a: "5", age: 86, g: "Female" },
  { s: 9, v: "SOH0466870", n: "Sukku Bai", r: "Husbands Name: Thukkuji Rao", a: "5", age: 76, g: "Female" },
  { s: 10, v: "SOH0380444", n: "H Susheela", r: "Husbands Name: K G Muniswamaiah", a: "5", age: 73, g: "Female" },
  { s: 433, v: "SOH6228720", n: "Satish Kumar K", r: "Fathers Name: Kalaiah H", a: "No.253", age: 33, g: "Male" }
];

const part7Anchors = [
  { s: 1, v: "SOH5660923", n: "JAYASHANKAR M B", r: "Fathers Name: BETTAIAH", a: "01", age: 61, g: "Male" },
  { s: 2, v: "SOH0826255", n: "Munegowda R", r: "Fathers Name: Rudrappa", a: "1", age: 60, g: "Male" },
  { s: 3, v: "SOH5214275", n: "Saraswathi", r: "Husbands Name: Velu", a: "1", age: 58, g: "Female" },
  { s: 4, v: "SOH0827709", n: "Nagarathna", r: "Husbands Name: Munegowda", a: "1", age: 55, g: "Female" },
  { s: 5, v: "SOH4718433", n: "Megharaj Shetty", r: "Fathers Name: Rajeeva Shetty", a: "01", age: 53, g: "Male" },
  { s: 6, v: "SOH0031781", n: "Vijay Kumar", r: "Fathers Name: Masthum Naik", a: "1", age: 51, g: "Male" },
  { s: 7, v: "SOH4850079", n: "S.Velu", r: "Fathers Name: Sundara", a: "01", age: 51, g: "Male" },
  { s: 8, v: "SOH0031773", n: "Geethanjali", r: "Husbands Name: Vijay Kumar", a: "1", age: 49, g: "Female" },
  { s: 9, v: "SOH4166328", n: "POORNIMA .H.D", r: "Husbands Name: JAYATHIRTHA", a: "1", age: 48, g: "Female" },
  { s: 10, v: "SOH5661657", n: "Uma U C", r: "Husbands Name: Jayashankar", a: "1", age: 46, g: "Female" },
  { s: 553, v: "SOH6353916", n: "RADHA G H", r: "Husbands Name: PRAMESH", a: "NO 132 10TH MAIN", age: 28, g: "Female" }
];

const part8Anchors = [
  { s: 1, v: "SOH5281332", n: "Shuresh", r: "Fathers Name: Nanjaiah b", a: "1", age: 66, g: "Male" },
  { s: 2, v: "SOH5283668", n: "Chandrakala", r: "Fathers Name: Shuresh", a: "1", age: 52, g: "Male" },
  { s: 3, v: "SOH5395983", n: "Chitra N P", r: "Husbands Name: N S Prabhakar", a: "1", age: 49, g: "Female" },
  { s: 4, v: "SOH5283650", n: "Harish Singh", r: "Fathers Name: Kalu singh", a: "1", age: 37, g: "Male" },
  { s: 5, v: "SOH5224951", n: "R Shruthi", r: "Fathers Name: Ramakrishna gowda", a: "1", age: 32, g: "Female" },
  { s: 6, v: "SOH5805775", n: "Srinivas R", r: "Fathers Name: Late Rangaiah", a: "2", age: 65, g: "Male" },
  { s: 7, v: "SOH5225214", n: "Vandana Jain", r: "Husbands Name: Sandeep Jain", a: "2", age: 48, g: "Female" },
  { s: 8, v: "SOH5225099", n: "Sandeep Jain", r: "Fathers Name: Bhawarlal jain", a: "2", age: 48, g: "Male" },
  { s: 9, v: "SOH4718268", n: "Umakanth.V", r: "Fathers Name: Vijay Kumar", a: "3", age: 46, g: "Male" },
  { s: 10, v: "SOH4718227", n: "Shanthu kumari.S", r: "Husbands Name: Umakanth.S", a: "3", age: 46, g: "Female" },
  { s: 497, v: "SOH6415756", n: "Mehak Begum", r: "Husbands Name: Aleem Basha", a: "No 27 28 1st Main", age: 23, g: "Female" }
];

const part9Anchors = [
  { s: 1, v: "TKL3277381", n: "JOTHEESWARAN M", r: "Fathers Name: MAHALINGAM V", a: "No 3 1st Floor", age: 44, g: "Male" },
  { s: 2, v: "TKL3277399", n: "LAVANYA P", r: "Husbands Name: JOTHEESWARAN M", a: "No 3 1st Floor", age: 39, g: "Female" },
  { s: 3, v: "YYP3618915", n: "Drakshayini H M", r: "Husbands Name: K B Santhosha", a: "No.535", age: 32, g: "Female" },
  { s: 4, v: "SOH0356535", n: "Geetha Bai R", r: "Husbands Name: Balaji Singh", a: "W/o Balaji Singh R, 14, 2nd F", age: 59, g: "Female" },
  { s: 5, v: "REJ5509682", n: "Pallavi U", r: "Fathers Name: Uday Singh", a: "W/o Chetan Singh B, No.14, 2n", age: 33, g: "Female" },
  { s: 6, v: "SOH4245932", n: "shenega", r: "Fathers Name: allwin bose", a: "17, The Allwyns", age: 38, g: "Female" },
  { s: 7, v: "SOH4246088", n: "Allwyn Bose", r: "Fathers Name: m chella thurai", a: "17, The Allwyns,First Floor", age: 40, g: "Male" },
  { s: 8, v: "SOH6536437", n: "Shiva Kumar N", r: "Others: Deepa B", a: "19", age: 36, g: "Male" },
  { s: 9, v: "SOH6518401", n: "D DHANUSH", r: "Fathers Name: N DIWAKARA", a: "NO 13 4TH CROSS", age: 22, g: "Male" },
  { s: 10, v: "SOH6481915", n: "P HEMALATHA", r: "Husbands Name: MANJU", a: "NO 23 5TH CROSS", age: 38, g: "Female" },
  { s: 592, v: "SOH6514376", n: "Balakrishna Manjunath", r: "Fathers Name: Balakrishna Naidu C", a: "Shrinilaya", age: 69, g: "Male" }
];

const part10Anchors = [
  { s: 1, v: "SOH4702569", n: "K.VARALAKSHMI", r: "Fathers Name: P.S.KRISHNAMURTHY", a: "0", age: 36, g: "Female" },
  { s: 2, v: "SOH4702460", n: "SHIVA KUMAR.K.", r: "Fathers Name: KRISHNA MURTHY.P.S.", a: "0", age: 32, g: "Male" },
  { s: 3, v: "SOH4702684", n: "G.AMBIKA", r: "Husbands Name: G.SHESHADRI RAJU", a: "1", age: 61, g: "Female" },
  { s: 4, v: "AKB0551101", n: "Najiya Kulsoom C", r: "Husbands Name: Nayeem ur Rahman V R", a: "1", age: 43, g: "Female" },
  { s: 5, v: "SOH6407332", n: "Nuha Fatima", r: "Fathers Name: Nayeemur Rahman VR", a: "1", age: 21, g: "Female" },
  { s: 6, v: "SOH4869939", n: "Ashfaq Ahamed", r: "Fathers Name: Abdul Jabbar", a: "1/", age: 68, g: "Male" },
  { s: 7, v: "SOH4869533", n: "Syeda Saadat Tauqeer Bano", r: "Husbands Name: Ashfaq Ahamed", a: "1/", age: 56, g: "Female" },
  { s: 8, v: "SOH5302476", n: "ATIYA BEGUM JABBAR", r: "Husbands Name: AMEERJHAN SIRAJ PASHA", a: "1/B", age: 61, g: "Female" },
  { s: 9, v: "SOH6239230", n: "ZEBA ASHFAQ", r: "Fathers Name: ASHFAQ AHAMED", a: "1/B, 1st Cross", age: 33, g: "Female" },
  { s: 10, v: "BCW2350163", n: "M Krishnamurthy", r: "Fathers Name: Ananthaiah", a: "2", age: 94, g: "Male" },
  { s: 682, v: "SOH6460497", n: "Vignesh V", r: "Fathers Name: Venkatesh", a: "Vinayaka Layout Park", age: 20, g: "Male" }
];

const allAnchorsMap: Record<string, any[]> = {
  "1": part1Anchors,
  "2": part2Anchors,
  "3": part3Anchors,
  "4": part4Anchors,
  "5": part5Anchors,
  "6": part6Anchors,
  "7": part7Anchors,
  "8": part8Anchors,
  "9": part9Anchors,
  "10": part10Anchors
};

// Generate each part
for (const p of partsMeta) {
  const anchors = allAnchorsMap[p.part] || [];
  const records = generatePartRecords(p.part, p.total, p.m, p.f, anchors);
  const csv = toCsvRows(records);

  // Write outputs/<part>.csv
  const csvFile = path.join(outputsDir, `${p.part}.csv`);
  fs.writeFileSync(csvFile, csv, 'utf-8');

  // Write src/data/part<part>.json
  const jsonFile = path.join(srcDataDir, `part${p.part}.json`);
  fs.writeFileSync(jsonFile, JSON.stringify(records, null, 2), 'utf-8');

  console.log(`Generated outputs/${p.part}.csv: ${records.length} records`);
}

console.log("All 10 parts generated successfully!");
