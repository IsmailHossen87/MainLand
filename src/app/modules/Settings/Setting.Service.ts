import { JwtPayload } from "jsonwebtoken";
import { USER_ROLES } from "../../../enums/user";
import { Contact, IContact, ISettings, Settings, SettingType } from "./Setting.model";
import { QueryBuilder } from "../../builder/QueryBuilder";
import { excludeField } from "../../../shared/constrant";
import { User } from "../user/user.model";
import { emailTemplate } from "../../../shared/emailTemplate";
import { emailHelper } from "../../../helpers/emailHelper";


// Create or update single settings document
const updateSetting = async (data: { type: string; title: string; content: string }) => {
  const { type, title, content } = data;

  const result = await Settings.findOneAndUpdate(
    { type },
    { title, content },
    { upsert: true, new: true }
  );

  return result;
};

const faqSetting = async (user: JwtPayload, data: { type: string; question: string, answer: string[], faqType: string }) => {
  const { type, question, answer, faqType } = data;
  if (USER_ROLES.ADMIN != user.role) {
    throw new Error("You are not authorized to create faq");
  }
  const result = await Settings.create({ type, question, answer, faqType, userId: user.id });
  return result;
};


const getQuestion = async (user: JwtPayload, faqType: string, query: Record<string, string>) => {

  // if (USER_ROLES.ADMIN != user.role) {
  //   throw new Error("You are not authorized to get faq");
  // }

  // Base query
  const baseQuery = Settings.find({
    type: SettingType.Faq,
    faqType,
    question: { $ne: "" }
  });

  const queryBuilder = new QueryBuilder(baseQuery, query);

  const allQuestion = queryBuilder
    .search(["question", "answer"])
    .filter()
    .dateRange()
    .sort()
    .paginate();

  // Check the final query filter
  const builtQuery = allQuestion.modelQuery as any;
  console.log("🎯 Final filter:", JSON.stringify(builtQuery.getFilter(), null, 2));

  const [meta, data] = await Promise.all([
    allQuestion.getMeta(),
    allQuestion.build(),
  ]);

  console.log("✅ Results:", { metaTotal: meta.total, dataLength: data.length });

  return { meta, data };
};


const getQuestionById = async (id: string) => {
  const result = await Settings.findById(id);
  if (!result) {
    throw new Error("Question not found");
  }
  return result;
}

// const getSpecificSetting = async (key: string) => {
//   // key কে SettingType এ convert করুন
//   const setting = await Settings.findOne({ type: key });


//   if (!setting) {
//     return null;
//   }

//   return setting;
// };
const getSpecificSetting = async (key: string) => {
  if (key === 'terms_and_conditions') {
    const termsAndConditions = await Settings.findOne({ type: SettingType.TermsAndConditions });
    const privacyPolicy = await Settings.findOne({ type: SettingType.PrivacyPolicy });

    const data = {
      termsAdnCondition: termsAndConditions?.content || "",
      privacyPolicy: privacyPolicy?.content || ""
    };

    return data;
  }

  const setting = await Settings.findOne({ type: key });

  if (!setting) {
    return null;
  }

  return setting;
};

const getTermsAndCondition = async () => {
  console.log("serviceTERMSSJFLASDF");
  const result = await Settings.findOne({ type: 'terms_and_conditions' });
  return result;
}

const contactSetting = async (userId: string, payload: IContact) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  const userPayload = {
    ...payload,
    userId: user._id,
    email: user.email
  }
  const result = await Contact.create(userPayload);
  return result;
};

const getContact = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(Contact.find(), query);
  const allContact = queryBuilder.search(excludeField)
    .filter()
    .dateRange()
    .sort()
    .paginate()

  const [meta, data] = await Promise.all([allContact.getMeta(), allContact.build()]);

  return { meta, data };
}
const getContactById = async (id: string) => {
  const result = await Contact.findById(id);
  if (!result) {
    throw new Error("Contact not found");
  }
  return result;
}
const contactEmail = async (id: string, adminMessage: string, adminId: string) => {
  // Validate admin
  const admin = await User.findById(adminId);
  if (!admin) {
    throw new Error("Admin not found");
  }

  // Find contact by ID
  const contact = await Contact.findById(id);
  if (!contact) {
    throw new Error("Contact not found");
  }

  // Check if already solved
  if (contact.status === "solved") {
    throw new Error("This contact has already been resolved");
  }


  // Update contact with admin response
  const updateData = {
    adminMessage: adminMessage.trim(),
    status: "solved" as const,
    adminId: admin._id
  };

  const updatedContact = await Contact.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!updatedContact) {
    throw new Error("Failed to update contact");
  }

  // Get user details for personalization
  const user = await User.findById(contact.userId);
  const userName = user?.name || "Valued Customer";

  const values = {
    adminMessage: adminMessage.trim(),
    email: user?.email || "",
    name: user?.name || "Valued Customer",
    status: "solved" as const,
    adminId: admin._id,
    usersMessage: contact.message,
  }

  const email = emailTemplate.contactResponseEmail(values);
  await emailHelper.sendEmail(email);
  return updatedContact;
};
const faqDelete = async (id: string) => {
  const result = await Settings.findByIdAndDelete(id);
  if (!result) {
    throw new Error("Faq not found");
  }
  return result;
}
const faqUpdate = async (id: string, payload: { question: string, answer: string[] }) => {
  const result = await Settings.findByIdAndUpdate(id, payload, { new: true });
  if (!result) {
    throw new Error("Faq not found");
  }
  return result;
}

const deleteContact = async (id: string) => {
  const result = await Contact.findByIdAndDelete(id);
  if (!result) {
    throw new Error("Contact not found");
  }
  return result;
}

const createTerms = async (data: { type: string; title: string; content: string }) => {
  const { type, title, content } = data;

  const result = await Settings.findOneAndUpdate(
    { type },
    { title, content },
    { upsert: true, new: true }
  );

  return result;
};
export const SettingService = {
  updateSetting,
  faqSetting,
  getQuestion,
  getQuestionById,
  getSpecificSetting,
  contactSetting,
  getContact,
  getContactById,
  contactEmail,
  faqDelete,
  faqUpdate,
  deleteContact,
  createTerms,
  getTermsAndCondition
};



// // Get all settings (single document)
// const getSettings = async () => {
//   const result = await Settings.findOne();
//   return result;
// };


