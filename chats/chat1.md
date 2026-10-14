# Stark Heating Mobile App

_Started 2026-10-14 11:59 UTC_

---

## User

creat a mobile app for a central heating company called stark heating and gas - use the design system i have made up and there is a comprehensive prompt supplied. i have unsplash connected should be abe to source images from there . higgsfield is also connected but want to budget no more than 10 credits

## Assistant

_[tool: read_skill_prompt]_

_[tool: list_files]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: list_files]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: unsplash__search_photos]_

_[tool: copy_files]_

_[tool: tool_search_tool_bm25]_

_[tool: read_file]_

_[tool: update_todos]_

_[tool: dc_write]_

_[tool: dc_write]_

_[tool: dc_write]_

_[tool: dc_write]_

## Assistant

_[tool: run_script]_

_[tool: show_html]_

_[tool: ready_for_verification]_

_[tool: update_todos]_

I've built **Stark App.dc.html**: the customer app and the owner app side by side, sharing one set of sample records. Anything you do on one phone shows up on the other straight away. A final check is still running and I'll pass on anything it flags.

- **Customer app:** home screen with next-service countdown, a 5-step booking request, booking detail with reschedule and cancel requests, accept or decline a quote, properties and their appliances, documents, account settings, and a gas-emergency safety screen.
- **Owner app:** dashboard counts, jobs by status, customers with search and a landlord portfolio summary, a 7-day calendar, scheduling that stops you double-booking an engineer, a completion record that sends the report to the customer, internal notes, a quote builder with revisions, invoices with manual payment recording, service reminders and settings.
- **Settings in the editor:** show one phone or both, and turn the "try the connected flow" guide on or off.

**Things to know:**
- **Images:** I used your design-system photos plus one from Unsplash, for the radiator replacement option. **Higgsfield wasn't used, so 0 credits spent.**
- **Saving:** changes are saved in your browser. Use Reset Demo Data to start over.
- **Not working yet:** email, text messages, push notifications, online payments and PDF downloads aren't real. Each one needs a provider account and is listed as not set up in the owner's Settings.
- **Phone number:** 01506 000 000 is a placeholder. Send me the real number and I'll swap it in.

## User

Found issues — fixing…

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

Image src is still parsed before resolving; I'll gate it behind an sc-if.

_[tool: run_script]_

_[tool: ready_for_verification]_

_[tool: run_script]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

I fixed both problems the check found, and the app now loads with no errors:

- **Broken image:** the service images in the booking flow no longer show a broken image while the page loads.
- **Owner label:** "Owner App · Admin" now stays on one line above the phone.

