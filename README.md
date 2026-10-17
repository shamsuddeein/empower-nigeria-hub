# S.i and Billionaires Hub Nig.Ltd

Build the global layout.

HEADER

- Left: the company logo (use a text placeholder "S.i and Billionaires Hub Nig.Ltd" with a simple navy dollar mark until I upload the real logo file. Make the logo component easy to swap).

- Desktop nav: Solar, Electric Vehicles, Phones and Gadgets, Land and Estate, Financial Services and Training, Become an Agent. "About", "FAQ", "Contact" go in a quieter secondary row or in the footer, not crowding the main nav. Group items sensibly if there is not enough space.

- Right: a green "Apply Now" button and a small "WhatsApp" text button.

- Mobile: a clean full screen menu with large tap targets, Apply Now at the top of the menu, WhatsApp and Call at the bottom.

- Header becomes sticky with a thin bottom border after scrolling a little.

MOBILE BOTTOM BAR

Fixed bar with two equal buttons: "Call us" and "WhatsApp". Hide it on the /apply page so it does not cover the form. Add bottom padding to the page so the bar never covers content.

FOOTER

Navy background. Four columns on desktop, stacked on mobile:

1. Company name and a two line description

2. Products (links)

3. Company (About, FAQ, Contact, Become an Agent, Agent Locator)

4. Contact (phone, WhatsApp, email, office address, working hours)

Bottom line: copyright and "Registered in Nigeria". Use placeholder values stored in one config file (src/config/company.ts) so I can change phone, WhatsApp number, email and address in one place. Every WhatsApp button must use this config and open a prefilled message such as "Hello, I want to know more about [page or product name]".   Build /electric-vehicles. Audience: okada riders and keke napep drivers who spend a lot on fuel every day.

1. Header: "Electric motorcycles and tricycles. Stop paying for fuel." Subtext with the main promise in one line.

2. Fuel savings calculator (small, separate from the installment one): inputs are daily fuel spend and days worked per week. Output is weekly and monthly fuel cost, and the estimate of what an electric vehicle would cost to charge (use a configurable placeholder percentage). Show the difference as the headline number in large text.

3. Vehicle models: a list of vehicles from the database. Each shows photo, name, type (motorcycle or tricycle), range, top speed, charging time, price, and a weekly payment. Filter by type. Button "Apply for this vehicle".

4. A simple "Petrol versus Electric" comparison table: fuel or charging cost, maintenance, noise, daily running cost, number of moving parts. Keep it honest, no exaggerated claims. Use placeholder values marked as estimates.

5. Where to charge and how service works: short, practical section (charging at home, charging stations, battery swap if applicable, service centers). Placeholder text.

6. Rider testimonials and photos.

7. Final call to action with Apply and WhatsApp. Build /phones-and-gadgets as a fast, simple catalogue.

- Top: short heading and a one line explanation of installment buying for phones.

- Filter bar: category (phones, laptops, tablets, accessories, power banks, others), brand, price range, and a sort option. On mobile, filters open in a bottom sheet.

- Product grid: 2 columns on mobile, 3 or 4 on desktop. Each card shows image (lazy loaded, fixed aspect ratio), name, cash price, and the installment price as the main figure, for example "N6,500 per week for 6 months". A small "In stock" or "Out of stock" label.

- Product detail view (a drawer or a separate route /phones-and-gadgets/:slug): image gallery, specifications list, price table showing different durations, and buttons "Apply for this" and "Ask on WhatsApp" with a prefilled message that includes the product name.

- Empty state and loading skeletons that match the layout.

- Data from the products table in Supabase. Do not hardcode products. Seed 8 sample products.

- Pagination or "Load more" to keep the page light. Build /land-and-estate.

1. Header with a short and honest introduction. Include a clear note on documents: "Every plot comes with documents. We show them to you before you pay."

2. Available plots: a list or grid from the database. Each plot shows: photo, estate name, location (town and state), plot size in square meters, cash price, installment plan summary (for example "N50,000 per month for 24 months"), status (Available, Few left, Sold), and document type (for example C of O, Deed of Assignment, Survey Plan). Filter by state and by price.

3. Plot detail page /land-and-estate/:slug: photos, location description, nearby landmarks, document list, payment plan table, a map link (Google Maps link only, no heavy map library), and an inquiry form.

4. Inquiry form fields: full name, phone number, state, which plot, preferred payment plan, preferred date to visit the site, message. Saves to the database and shows a clear success message with the option to continue on WhatsApp.

5. A short section "How buying land from us works" with numbered steps: inquiry, site visit, agreement and documents, payment plan, allocation and handover. 

6. A short section on site visits, with a button to book one.  Build /financial-services-and-training. Keep it organized in two clear parts, with an anchor link at the top to jump to each.

PART 1: FINANCIAL SERVICES

A clean list of services, each with a title, a plain description, what to bring, and the cost or "Free" where relevant: POS and agent banking setup, BVN enrollment, NIN enrollment and linking, financial consultancy. Present it as a table style list, not as identical cards. Add a "Visit or call us" line with office address and hours. Add a small note explaining that we never ask for your PIN, password or OTP.

PART 2: TRAINING

List of training courses from the database: Solar installation training, POS business training. For each: what you will learn, duration, price, start date, mode (in person), and how many seats are left. Each has a "Sign up" button that opens a sign up form on the same page (a modal on desktop, full screen sheet on mobile).

Sign up form fields: full name, phone number, email (optional), state, which course, highest level of education (optional), any experience (optional). Save to a training_signups table. Show a confirmation message with the next step.

Add a short "What you get after training" section: practical skills, certificate (if applicable), and how trained people can become agents with us.   Build two pages.

/become-an-agent

1. Header: "Become an agent or ambassador" with a short, honest explanation of how agents earn (placeholder commission text, clearly editable).

2. Two options side by side: Agent (sells and handles customers in a local area) and Ambassador (refers customers and earns a referral commission). Explain the difference in plain terms.

3. Requirements list, how payment works, and what support we give (training, materials, a dedicated contact).

4. Registration form: full name, phone number, WhatsApp number, email (optional), state, local government area, town, agent or ambassador, occupation, do you have a shop or location (yes or no), short note about yourself, and a checkbox for agreeing to be contacted. Validate Nigerian phone numbers. Save to the agents_applications table with status "Pending". Clear success screen.

/agent-locator

1. Header: "Find an agent near you".

2. A state selector for Northern Nigeria states (Kaduna, Kano, Katsina, Jigawa, Bauchi, Gombe, Yobe, Borno, Adamawa, Taraba, Sokoto, Kebbi, Zamfara, Niger, Kwara, Kogi, Benue, Plateau, Nasarawa, Abuja FCT). Selecting a state shows the approved agents in that state, grouped by local government area or town.

3. Each agent entry shows name, town, phone number as a tap-to-call link, and a WhatsApp button. Only show agents with status "Approved" and "Show publicly" turned on.

4. A search box that filters by name or town.

5. Empty state: "No agent in this state yet" with a button to contact the head office and a link to become an agent.

Keep it light: no map library, just a clear list.   Build three pages with real, plain copy.

/about

- Short company story (placeholder, written plainly, no corporate language), what we believe, what we offer, and how we work. Add a "Our promise to customers" section with 4 firm commitments, for example: full price shown before signing, written agreement, no hidden fees, technicians who show up. Add a team section with photo placeholders and roles. Add company registration details (RC number placeholder) and office address.

/faq

- Grouped by topic: Solar, Electric Vehicles, Phones and Gadgets, Land and Estate, Payments and Plans, Agents. Use an accessible accordion (keyboard friendly). Add a search box that filters questions. Write at least 4 useful questions per group, in plain language, with placeholder answers marked for review. At the bottom: "Did not find your answer?" with WhatsApp and call buttons. Add FAQPage structured data.

/contact

- Left: contact details (phone, WhatsApp, email, address, hours) and a Google Maps link. Right: a simple contact form (name, phone, topic dropdown, message) saving to a messages table. Show success state. Repeat the call and WhatsApp buttons prominently above the form because most people prefer to call.   Build the admin dashboard at /admin. Use Supabase Auth with email and password. Only users in an "admins" table can enter. No public sign up. Use a clean, dense, functional design with the same colors, not the public site's marketing look.

LAYOUT

Left sidebar (collapses to a top menu on mobile): Overview, Applications, Products, Land, Agents, Agent Applications, Training, Testimonials and Gallery, Messages, Settings.

OVERVIEW

Counts: new applications today, this week, pending agent applications, new messages. A simple list of the latest 10 applications. No heavy chart library.

APPLICATIONS

Table with search, filters (status, category, state, date), and sorting. Statuses: New, Contacted, Approved, Rejected, Completed. Click a row to see full detail in a side panel, change status, add internal notes, one-click call and WhatsApp buttons, and export to CSV.

PRODUCTS

Add, edit, delete and reorder products. Image upload to Supabase storage with automatic resizing and compression. Fields: category, name, description, cash price, specs, stock status, featured toggle. Preview how it appears on the site.

LAND

Add and edit plots, upload photos, set status.

AGENTS

Approve or reject agent applications. Edit agent details, set "Show publicly" toggle. Filter by state.

TRAINING

Manage courses, seats, dates, and view sign ups. Export CSV.

TESTIMONIALS AND GALLERY

Upload photos and videos (video as a link or upload), approve testimonials before they show on the site.

SETTINGS

Edit the installment markup percentages per duration, the company phone, WhatsApp number, email and address (these update the whole site), and FAQ entries.

Every action needs a confirmation for delete, a clear success or error message, and loading states.  Do a full quality pass on the whole site.

1. Performance: run through every page for mobile. Reduce bundle size, lazy load routes and images, add proper image dimensions, compress uploads, remove unused code. Target a fast first load on slow 3G.

2. Accessibility: color contrast at least AA, visible focus states, labels on all inputs, proper heading order, alt text on every image, keyboard navigation for menus and accordions.

3. Copy check: remove any word from the banned list, any exclamation marks, any emoji, any decorative symbol, any vague marketing phrase. Replace with specific and plain wording.

4. Design check: find any place where three identical cards appear in a row, any generic gradient, or any layout that looks like a template, and redesign it with a more distinctive layout while keeping the system consistent.

5. SEO: unique title and description per page, Open Graph tags, sitemap, robots, structured data for the organization and FAQ, readable URLs.

6. Forms: test every form for validation, empty states, error states and success states. Make sure double submission is blocked.

7. Check all WhatsApp and call links on every page and that they use the central config.

8. Test layouts at 360px, 390px, 768px and 1280px.

Report what you changed.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2934c743-42da-4ef7-80bb-136a6284408c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
