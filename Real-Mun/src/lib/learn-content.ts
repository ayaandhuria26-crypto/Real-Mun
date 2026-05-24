export type LearnSection = {
  id: string;
  title: string;
  blurb: string;
  items: { term: string; def: string; example?: string }[];
};

export const learnSections: LearnSection[] = [
  {
    id: "first-day",
    title: "Your First Day, Explained",
    blurb:
      "A MUN committee is a structured debate. You represent a country, not yourself. Everything you say is a 'speech.' Everything you do procedurally is a 'motion' or a 'point.' Stick to that frame and you'll never look lost.",
    items: [
      {
        term: "Delegate",
        def: "You. You represent one country and speak only for that country's interests, never your personal opinion.",
      },
      {
        term: "Chair / Dais",
        def: "The people running the committee. They decide the speaking order, time limits, and what motions are in order.",
      },
      {
        term: "Placard",
        def: "The card with your country name on it. Raise it to be recognized to speak, to motion, or to vote.",
      },
      {
        term: "Quorum",
        def: "Minimum number of delegates needed to start debate. Usually announced at the start by the Chair.",
      },
    ],
  },
  {
    id: "parli-pro",
    title: "Parliamentary Procedure (Parli Pro)",
    blurb:
      "Parli Pro is the rulebook for how the committee flows. Most rookies fear it. Don't. There are really only ~6 motions you need on day one.",
    items: [
      {
        term: "Motion to Open Debate",
        def: "Used at the very start to formally begin substantive discussion.",
        example: `"Motion to open debate on the topic of climate financing."`,
      },
      {
        term: "Motion to Set the Speakers' List",
        def: "Opens a running list of delegates who want to give general speeches on the topic.",
      },
      {
        term: "Moderated Caucus",
        def: "Structured discussion on a sub-topic. Chair calls on raised placards. You propose total time, individual speaking time, and the topic.",
        example: `"Motion for a 10-minute moderated caucus, 1-minute speaking time, on funding mechanisms."`,
      },
      {
        term: "Unmoderated Caucus",
        def: "Informal time — delegates leave their seats and negotiate, form blocs, and draft papers.",
        example: `"Motion for a 15-minute unmoderated caucus to begin bloc work."`,
      },
      {
        term: "Point of Order",
        def: "Used when you believe procedure is being broken. Should be rare. The Chair rules immediately.",
      },
      {
        term: "Point of Inquiry",
        def: "A question to the Chair (not another delegate) about procedure or instructions.",
      },
    ],
  },
  {
    id: "speeches",
    title: "How to Give a Speech That Lands",
    blurb:
      "Most rookie speeches are list of facts. Winning speeches make one clear policy ask and tie it to a coalition. Aim for: 1 acknowledgement, 1 problem framing, 1 proposal, 1 call for support.",
    items: [
      {
        term: "Opening Line",
        def: "Acknowledge the Chair and the body. Builds credibility before content.",
        example: `"Honorable Chair, fellow delegates — the delegation of France believes…"`,
      },
      {
        term: "Frame the Problem",
        def: "One sentence on the stakes, ideally with a number or named consequence.",
      },
      {
        term: "Make a Specific Ask",
        def: "Name a mechanism, fund, body, or timeline. Vague speeches don't get cited in resolutions.",
        example: `"…a UNFCCC-administered Loss & Damage fund, capitalized at $100B annually by 2030."`,
      },
      {
        term: "Invite Coalition",
        def: "End by naming delegations you want to work with, or the kind of bloc you're seeking.",
      },
    ],
  },
  {
    id: "position-paper",
    title: "Position Papers in 4 Sections",
    blurb:
      "A position paper is your country's pre-conference statement. Keep it under two pages. Chairs skim — make every section pull weight.",
    items: [
      {
        term: "Topic Background",
        def: "Show you understand the issue without copy-pasting Wikipedia. 1 paragraph, focused on what matters for your country.",
      },
      {
        term: "Country Position",
        def: "Your country's actual stance. Cite real treaties, votes, statements. This is where most rookies lose marks.",
      },
      {
        term: "Past Action",
        def: "What has your country (or the body) already done? Include UN resolutions, funding commitments, or domestic policy.",
      },
      {
        term: "Proposed Solutions",
        def: "2-3 concrete proposals that fit your country's policy. Should preview the resolution language you'll push.",
      },
    ],
  },
  {
    id: "blocs",
    title: "Blocs & Coalition-Building",
    blurb:
      "Resolutions are written in unmoderated caucus by groups of countries called 'blocs.' Joining or leading a bloc is how you become a 'main submitter' and win awards.",
    items: [
      {
        term: "Bloc",
        def: "A group of delegates working on the same draft resolution. Usually forms along regional, ideological, or economic lines.",
      },
      {
        term: "Working Paper",
        def: "Early-stage draft of solutions. Not yet a resolution. Shared informally with the Chair.",
      },
      {
        term: "Draft Resolution",
        def: "Formal document submitted for debate. Has preambulatory and operative clauses.",
      },
      {
        term: "Sponsor / Signatory",
        def: "Sponsors write and defend the resolution. Signatories just want it to be debated and don't necessarily agree with it.",
      },
    ],
  },
  {
    id: "rookie-traps",
    title: "Rookie Traps to Avoid",
    blurb:
      "These are the mistakes Chairs notice on day one. Avoiding them is the cheapest way to look experienced.",
    items: [
      {
        term: "Speaking for yourself",
        def: `Never say "I think." Always say "the delegation of [country] believes." You are a diplomat, not a person.`,
      },
      {
        term: "Overusing Points of Order",
        def: "Chairs hate this. Use only when procedure is actually broken, not to disagree with another delegate.",
      },
      {
        term: "Ignoring your country's real policy",
        def: "Don't propose climate funding as Saudi Arabia. Don't propose abolishing the veto as the US. Chairs check.",
      },
      {
        term: "Sitting silent in unmod",
        def: "Awards are won in unmoderated caucus. If you don't walk over to a bloc and start writing, you don't exist.",
      },
    ],
  },
];
