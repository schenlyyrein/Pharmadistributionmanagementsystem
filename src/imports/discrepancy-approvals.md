Figma Prompt: Discrepancy Approvals interactions + counters

Goal: Prototype a Discrepancy Approvals page where clicking Approve/Reject updates the card’s status pill and updates the top summary counters (Pending, Approved, Rejected).

Frames to create
	•	Desktop frame: “Discrepancy Approvals”
	•	Layout: left sidebar + main content area
	•	Main content:
	1.	Page title + subtitle
	2.	Status filter dropdown (visual only)
	3.	Summary stat cards (3): Pending Review, Approved, Rejected
	4.	Discrepancy list with cards (at least 3 cards)

Create Components
	1.	Status Pill component with variants:
	•	Pending: orange background, white text, rounded-full pill
	•	Approved: teal background, white text, rounded-full pill
	•	Rejected: red background, white text, rounded-full pill
Pill sizing: auto-layout, padding 10–12 horizontal and 6 vertical, corner radius 999
	2.	Discrepancy Card component with variants by status:
	•	Pending variant shows buttons: Approve Discrepancy, Reject & Investigate, View Details
	•	Approved variant hides Approve/Reject buttons and shows message “This discrepancy has been approved”
	•	Rejected variant hides Approve/Reject buttons and shows message “This discrepancy has been rejected”
Include: GRN number, product name, SKU, Expected/Received/Variance, Reported by, Date, Notes, Status Pill.
	3.	Summary Stat Card component
	•	Icon + big number + label
	•	Make number text bound to a variable

Create Variables
Create a Variable Collection named DiscrepancyCounts:
	•	pendingCount (number) default 22
	•	approvedCount (number) default 0
	•	rejectedCount (number) default 0

Create another Variable Collection named CardStates for each card:
	•	card1Status (string) default “pending”
	•	card2Status default “pending”
	•	card3Status default “pending”

Bind:
	•	Pending Review stat number → pendingCount
	•	Approved stat number → approvedCount
	•	Rejected stat number → rejectedCount

For each discrepancy card:
	•	Status Pill variant should depend on its cardXStatus value (“pending/approved/rejected”)
	•	Card component variant should depend on cardXStatus as well

Prototype Interactions
For each card:
	1.	Approve Discrepancy button
On click:

	•	Set cardXStatus = “approved”
	•	Set pendingCount = pendingCount - 1
	•	Set approvedCount = approvedCount + 1
	•	Keep user on the same page (no navigation)

	2.	Reject & Investigate button
On click:

	•	Set cardXStatus = “rejected”
	•	Set pendingCount = pendingCount - 1
	•	Set rejectedCount = rejectedCount + 1
	•	Keep user on the same page

	3.	View Details button
On click:

	•	Navigate to a “Discrepancy Details” frame (create a simple details page)
	•	Add Back button that returns to the approvals page

Visual rules
	•	Pending pill must be oval (rounded-full), not a rectangle badge
	•	Approved pill teal, Rejected pill red, Pending pill orange
	•	Buttons aligned right side of each card like the current layout
	•	Ensure spacing consistent with clean admin dashboard style