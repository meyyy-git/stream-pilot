# Stream Pilot

Stream Pilot is a mobile control surface for monitoring a livestream and operating its production tools.

## Language

**Clean Live Chat View**:
A YouTube popout live-chat page displayed without YouTube's header, sign-in prompt, or authenticated session. It supports reading and scrolling while blocking navigation away, and does not extract chat messages into application data.
_Avoid_: Chat parser, chat feed

**Stream Link**:
A YouTube video, livestream, or popout-chat URL supplied by the operator to open the Clean Live Chat View without using the YouTube API.
_Avoid_: Channel connection, YouTube API configuration

**Local OBS Connection**:
A direct control connection from Stream Pilot to an OBS instance reachable on the same local network. Internet-based remote control is outside this boundary.
_Avoid_: Remote OBS connection, cloud connection

**Scene Switch**:
An operator command that changes the active OBS Program scene directly. Preview and Transition controls are outside this boundary.
_Avoid_: Scene edit, Preview selection

**Source Visibility**:
An operator command that shows or hides an existing source within an OBS scene. Editing source properties is outside this boundary.
_Avoid_: Source edit, source configuration

**Trakteer Control**:
A control assigned to one Trakteer widget and backed by a Trakteer Action URL. Stream Pilot supports Trakteer only until another donation platform is actually required.
_Avoid_: Donation provider adapter, generic donation control

**Trakteer Action URL**:
A private URL issued by Trakteer for one specific widget action, such as advancing an Alert Box to the next item.
_Avoid_: General Trakteer API, public endpoint

**Trakteer Control Bank**:
A fixed set of Alert + Mediashare or Gacha actions. The operator supplies only the private URL for each action.
_Avoid_: User-defined group, automatic action discovery

**Trakteer Test Action**:
A private URL used from Settings to send a notification or platform-specific media test to the overlay.
_Avoid_: Live Console test button, generated test payload

**Stream Setup**:
The single active configuration containing the Clean Live Chat View, Local OBS Connection, and fixed Trakteer action URLs used by the operator.
_Avoid_: Workspace, profile

**Live Console**:
The operational screen that presents Clean Live Chat, OBS controls, and Trakteer controls simultaneously on tablets or through bottom navigation on phones.
_Avoid_: Separate feature routes, remounting tab content

**Console Section**:
A persistent area of the Live Console whose content and connections remain alive when hidden behind phone navigation.
_Avoid_: Collapsible rail, remounting tab content
