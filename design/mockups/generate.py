import math
import pathlib
import sys

OUT = pathlib.Path(sys.argv[1])

HEAD = '''<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&display=swap">
<link rel="stylesheet" href="style.css">'''

OWL = ('<svg viewBox="-56 -56 112 112" aria-hidden="true"><rect x="-56" y="-56" width="112" height="112" rx="30" fill="#099bff" opacity=".18"/>'
       '<rect x="-50" y="-50" width="100" height="100" rx="27" fill="#099bff"/><circle cx="-19" cy="-2" r="18" fill="#fff"/><circle cx="19" cy="-2" r="18" fill="#fff"/>'
       '<circle cx="-19" cy="0" r="9" fill="#ff8a3d"/><circle cx="19" cy="0" r="9" fill="#0b4f8a"/><circle cx="-16" cy="-4" r="3" fill="#fff"/><circle cx="22" cy="-4" r="3" fill="#fff"/>'
       '<path d="M-6 19 L6 19 L0 28 Z" fill="#ffc46b"/></svg>')
ICONS = {
    "doc": "M6 3h9l4 4v14H6z M14 3v5h5 M9 13h7 M9 17h5",
    "link": "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1 M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
    "check": "M5 12.5l4.5 4.5L19 7",
    "flag": "M5 21V4h11l-2 4 2 4H5",
    "x": "M6 6l12 12 M18 6L6 18",
    "download": "M12 4v11 M7 10l5 5 5-5 M5 20h14",
    "lock": "M7 11V8a5 5 0 0 1 10 0v3 M5 11h14v10H5z",
    "clock": "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2",
    "chev": "M9 6l6 6-6 6",
    "search": "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M20 20l-4-4",
}

# The sample student's Essay 2, the same numbers as the product film.
TITLES = ["Outline the argument", "Find two sources", "Draft the intro", "Check the facts", "Strengthen paragraph 2",
          "Check the conclusion", "Fix a misquoted statistic", "Tighten the wording", "Final proofread"]
FIXED = [1, 3, 6]
FLAGGED = [5, 7]
DEPTH = [2, 3, 2, 3, 2, 0, 3, 1, 2]
USED = [0, 0, 150, 0, 130, 0, 64, 0, 40]
FINAL_WORDS = 1200
MATCHED = sum(USED)
# Share of the final essay matching none of the logged AI answers: a prompt for judgement, not proof of authorship.
UNMATCHED = 1 - MATCHED / FINAL_WORDS
UNMATCHED_PCT = f"{UNMATCHED * 100:.0f}%"
# Draws each dotted connector between the real elements it joins, once the entrance motion has settled.
CONNECT = """<script>
addEventListener("load", () => setTimeout(() => {
  for (const svg of document.querySelectorAll("svg.connect")) {
    const box = svg.getBoundingClientRect();
    const a = document.querySelector(svg.dataset.from).getClientRects()[0];
    const b = document.querySelector(svg.dataset.to).getBoundingClientRect();
    const [ax, ay] = [a.right - box.left + 10, a.top + a.height / 2 - box.top];
    const top = svg.dataset.side === "top";
    const [bx, by] = top ? [b.left + b.width / 2 - box.left, b.top - box.top - 10] : [b.left - box.left - 10, b.top + b.height / 2 - box.top];
    const bend = top ? `${bx} ${by - 140}` : `${bx - 90} ${by}`;
    svg.querySelector("path").setAttribute("d", `M${ax} ${ay} C${ax + 120} ${ay} ${bend} ${bx} ${by}`);
    const [from, to] = svg.querySelectorAll("circle");
    from.setAttribute("cx", ax); from.setAttribute("cy", ay);
    to.setAttribute("cx", bx); to.setAttribute("cy", by);
    svg.classList.add("on");
  }
}, 1600));
</script>"""
QUESTIONS = ["Was the AI right or wrong?", "How did you check?", "What did you change?"]
SUBMITTED = 48


def icon(name, cls="ic"):
    return f'<svg class="{cls}" viewBox="0 0 24 24"><path d="{ICONS[name]}"/></svg>'


def frac(x):
    return x - math.floor(x)


def noise(n):
    return frac(math.sin(n * 127.1 + 311.7) * 43758.547)


def shares():
    """Own-writing share of every submitted essay; John Doe and Alex Kim come first."""
    return [0.68, 0.81] + [0.5 + 0.44 * (noise(i * 1.7) * 0.6 + noise(i * 4.3) * 0.4) for i in range(2, SUBMITTED)]


def median(values):
    s = sorted(values)
    return (s[len(s) // 2 - 1] + s[len(s) // 2]) / 2


def depth(n, tone=""):
    dots = "".join('<b></b>' if i < n else '<b class="o"></b>' for i in range(3))
    return f'<span class="depth {tone}">{dots}</span>'


def question(label, state):
    mark = {"met": icon("check", ""), "missed": icon("x", ""), "open": ""}[state]
    return f'<div class="q {state}"><i>{mark}</i>{label}</div>'


def questions(state):
    return '<div class="qs">' + "".join(question(q, state) for q in QUESTIONS) + "</div>"


def chip(label, tone="", dot=True):
    return f'<span class="chip {tone}{" dot" if dot else ""}">{label}</span>'


def paper(title, body, r=0, cls="", style="", end=""):
    end_html = f'<span class="end">{end}</span>' if end else ""
    return (f'<article class="paper {cls}" style="--r:{r}deg;{style}"><header>{icon("doc")}{title}{end_html}</header>'
            f'<div class="body">{body}</div></article>')


def sticky(body, color="", r=0, d=0, cls="", style=""):
    return f'<div class="sticky {color} {cls}" style="--r:{r}deg;--d:{d};{style}">{body}</div>'


def aside(text, path, w, h, r=-4, style="", before=False, length=200):
    arrow = f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}"><path d="{path}" style="--len:{length}"/></svg>'
    inner = arrow + f"<span>{text}</span>" if before else f"<span>{text}</span>" + arrow
    return f'<div class="aside" style="--r:{r}deg;{style}">{inner}</div>'


def nav(role=None, active=0):
    logo = f'<div class="logo">{OWL}AI-Interaction Analytics</div>'
    if role is None:
        return (f'<nav class="nav">{logo}<div class="links"><span>How it works</span><span>For students</span><span>For graders</span></div>'
                '<div class="nav-end"><span class="who" style="font-weight:600">Sign in</span>'
                '<button class="btn primary sm" type="button">Get started</button></div></nav>')
    tabs, person, tone, chip_tone, who = {
        "student": (["Assignments", "My log", "Progress"], "John Doe", "", "human", "Student"),
        "grader": (["Cohort", "Visualiser", "Flags", "Reports"], "Jane Doe", "ai", "ai", "Grader"),
    }[role]
    items = "".join(f'<button class="tab{" on" if i == active else ""}" type="button">{t}</button>' for i, t in enumerate(tabs))
    return (f'<nav class="nav">{logo}<div class="tabs">{items}</div><div class="nav-end">{chip(who, chip_tone)}'
            f'<span class="who"><span class="avatar {tone}">JD</span>{person}</span></div></nav>')


def page(name, title, nav_html, body, css=""):
    html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} · AI-Interaction Analytics</title>
{HEAD}
<style>{css}</style>
</head>
<body>
<div class="app">
{nav_html}
<main class="page">
{body}
</main>
</div>
{CONNECT}
</body>
</html>
'''
    (OUT / name).write_text(html)


def head(title, sub, crumb="", end=""):
    crumb_html = f'<p class="crumb">{crumb}</p>' if crumb else ""
    return f'<div class="head"><div>{crumb_html}<h1>{title}</h1><p class="sub">{sub}</p></div>{end}</div>'


# 01: home and sign-in -----------------------------------------------------------------------------------------------

LOG = [("Me", "Write an intro on the two-lane model", False), ("AI", "Sure! It was introduced in 2019 by", True),
       ("Me", "That's wrong. Check the date.", False), ("AI", "You're right, apologies for the error.", False),
       ("Me", "Cite a source for paragraph two", False), ("AI", "Smith & Lee (2019), J. Assessment", True),
       ("Me", "That paper doesn't exist.", False), ("AI", "Here's a revised version:", False),
       ("Me", "Shorter. Keep my argument.", False), ("AI", "As an AI language model, I", False),
       ("Me", "Para 2 contradicts para 4", False), ("AI", "Good catch! Updated below.", False),
       ("Me", "Rewrite it in my own voice", False), ("AI", "Certainly! Here is the essay:", False)]

log_rows = "".join(
    f'<li><b class="{"label-ai" if who == "AI" else "label-human"}">{who}:</b><span{" class=wavy" if bad else ""}>{line}</span></li>'
    for who, line, bad in LOG)
page("01-sign-in.html", "Sign in", nav(), f'''
<section class="hero">
  <div class="copy">
    {chip("Built for Lane 2 assessment", "ai")}
    <h1 class="mega">See the <span class="marker">thinking</span><br>behind the work.</h1>
    <p class="lead">Students import their AI chats and critique every step.<br>Graders see the whole process at a glance.</p>
    <form class="signin" onsubmit="return false">
      <input class="input" type="email" value="jdoe123@aucklanduni.ac.nz" aria-label="University email">
      <button class="btn primary" type="submit">Send sign-in link</button>
    </form>
    <p class="caption">One-time link to your university email. No password.</p>
    <p class="caption lock">{icon("lock")}Made for INFOMGMT 399, Information and Technology Management</p>
  </div>
  <div class="art">
    {aside("the messy middle, made readable", "M4 6 C44 8 64 20 76 40 M76 40 l-13 -4 M76 40 l2 -13", 84, 48, -4, "left:-30px;top:-8px", length=110)}
    <div class="paper blank" style="--r:7deg;left:80px;top:46px"></div>
    <div class="paper blank" style="--r:-5deg;left:20px;top:60px"></div>
    {paper("essay2-ai-log.docx", f'<ul class="log">{log_rows}</ul>', -1.5, "front")}
    {sticky('<span class="kicker label-human">John&#39;s critique</span><p>Wrong date. Sydney introduced it in 2023.</p>', "", 5, 0, "pin", "left:340px;top:68px;width:290px")}
    {sticky('<span class="kicker label-flag">Reflection check</span><p>“Looks good.” Take a closer look.</p>', "pink", -6, 1, "pin", "left:-90px;top:380px;width:280px")}
    {sticky('<span class="kicker label-ok">AI error caught</span><p>Fake source replaced.</p>', "mint", 3, 2, "pin", "left:380px;top:540px;width:260px")}
  </div>
</section>''', '''
.page { padding-top: 40px; }
.hero { display: grid; grid-template-columns: 1fr 600px; gap: 64px; align-items: start; }
.copy { display: flex; flex-direction: column; align-items: flex-start; gap: 22px; padding-top: 48px; }
.mega { font-size: 84px; line-height: 1.04; letter-spacing: -0.03em; color: var(--ink); }
.lead { font-size: 25px; color: var(--body); }
.signin { display: flex; gap: 12px; width: 100%; max-width: 620px; margin-top: 10px; }
.signin .input { flex: 1; }
.lock { display: flex; align-items: center; gap: 8px; }
.lock .ic { width: 18px; height: 18px; }
.art { position: relative; height: 760px; margin-top: 60px; }
.art .paper { position: absolute; }
.art .blank { width: 520px; height: 640px; }
.art .front { left: 0; top: 36px; width: 560px; height: 660px; }
.log { list-style: none; margin: 0; padding: 0; display: grid; gap: 13px; font-size: 17px; }
.log li { display: grid; grid-template-columns: 44px 1fr; color: var(--body); }
.log b { font-weight: 600; }
.wavy { text-decoration: underline wavy var(--flag) 1.5px; text-underline-offset: 6px; }
''')


# 02: student assignments ---------------------------------------------------------------------------------------------

def assignment(file, lane, title, due, logged, brief, action, note, note_color, r, nr, d):
    dots = "".join(f'<i class="{"h" if k % 2 == 0 else "a"}"></i>' for k in range(logged))
    logged_text = f"{logged} steps logged" if logged else "No AI log needed"
    return f'''<div class="slot">
  {paper(file, f"""{lane}<h2>{title}</h2><p class="due">{icon("clock")}{due}</p><div class="dots">{dots}</div>
    <p class="logged">{logged_text}</p><p class="brief">{brief}</p><div class="act">{action}</div>""", r)}
  {sticky(f"<p>{note}</p>", note_color, nr, d, "pin", "right:-16px;top:-46px;width:236px")}
</div>'''


page("02-student-dashboard.html", "Assignments", nav("student", 0), f'''
{head("Assignments", "Three tasks this semester. Lane 2 ones keep an AI log.")}
<section class="sheets">
  {assignment("INFOMGMT 399 · Essay 2", chip("Lane 2 · AI allowed", "ai"), "Essay 2:<br>The two-lane model", "Due Friday", 3,
              "Argue why universities split assessment into two lanes. Import each AI chat as you go.",
              '<button class="btn primary sm" type="button">Add steps</button>', "3 steps so far. Keep logging!", "", -1.4, 5, 0)}
  {assignment("INFOMGMT 399 · Lab 4", chip("Lane 1 · AI restricted", "plain"), "Lab 4:<br>Database design", "Due Monday", 0,
              "Design the schema in the supervised lab. No AI, so there is nothing to log.",
              '<button class="btn ghost sm" type="button">Open</button>', "Lane 1: no AI here", "sky", 1.2, 1, 1)}
  {assignment("INFOMGMT 399 · Reflection 1", chip("Lane 2 · AI allowed", "ai"), "Reflection 1:<br>Using AI critically", "Submitted", 6,
              "Reflect on one time the AI was wrong and how you noticed. Six steps logged.",
              chip("Submitted", "ok"), "Submitted. Nice work.", "mint", -0.8, -3, 2)}
</section>''', '''
.sheets { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; margin-top: 70px; }
.slot { position: relative; }
.slot .paper { height: 560px; }
.slot .body { display: flex; flex-direction: column; gap: 14px; flex: 1; }
.slot .body > .chip { align-self: flex-start; }
.slot h2 { font-size: 34px; line-height: 1.2; margin-top: 10px; }
.due { display: flex; align-items: center; gap: 8px; color: var(--muted); font-weight: 500; }
.due .ic { width: 18px; height: 18px; }
.dots { display: flex; gap: 8px; min-height: 10px; margin-top: 10px; }
.dots i { width: 26px; height: 10px; border-radius: 5px; background: var(--human); }
.dots i.a { background: var(--ai); }
.logged { font-weight: 600; }
.brief { color: var(--body); }
.act { margin-top: auto; }
''')


# 03: student adds steps from a chat ----------------------------------------------------------------------------------

timeline = [(1, "done", "Logged Monday"), (2, "done", "Logged Monday"), (3, "done", "Logged Tuesday"),
            (4, "now", "From this chat · writing critique"), (5, "todo", "From this chat · needs a critique")]
timeline_rows = "".join(
    f'''<li class="{state}"><span class="n">{icon("check", "ic") if state == "done" else n}</span>
<span><b>Step {n} · {TITLES[n - 1]}</b><small>{note}</small></span>{depth(DEPTH[n - 1]) if state == "done" else ""}</li>''' for n, state, note in timeline)
page("03-student-workspace.html", "Add steps", nav("student", 0), f'''
{head("Add steps", "Paste a chat link. Each prompt becomes a step; you add the critique.", "Assignments  /  Essay 2  /  Add steps",
      '<div class="stepper"><span class="done">' + icon("check") + 'Import</span><span class="on">2  Critique</span><span>3  Save</span></div>')}
<div class="import">
  {icon("link")}<span class="value">chatgpt.com/share/6f2a91c4-essay-2</span>
  <span class="found">{icon("check")}2 new steps</span>
</div>
<section class="work">
  <aside class="card steps">
    <p class="kicker label-muted">Essay 2 · steps</p>
    <ol>{timeline_rows}</ol>
    <button class="btn ghost sm" type="button">Write final version</button>
  </aside>
  {paper("Step 4 · Check the facts", f"""<p class="kicker label-human">You asked</p>
    <p class="asked">Why do universities split assessment into two lanes?</p>
    <p class="kicker label-ai">The AI said</p>
    <p class="said">The two-lane model, introduced in <span class="wrong">2019</span>, separates secure assessment from open tasks where AI use is allowed. Lane 1 restricts AI; Lane 2 lets students use it.</p>
    <p class="src">Imported from chatgpt.com/share/6f2a91c4 · 14:20</p>""", 0, "step", end=chip("1 error marked", "flag"))}
  <div class="side">
    {sticky(f"""<span class="kicker label-human">Your critique</span>
      <p class="crit"><span class="hl">Wrong date.</span> Sydney introduced it in 2023. <span class="hl">I checked their article</span> and <span class="hl">fixed my intro</span>.</p>
      <hr>{questions("met")}""", "", 2.5, 0, "note")}
    <div class="save"><button class="btn primary" type="button">Save step</button><span class="caption">or press <span class="key">⌘ ↵</span></span></div>
  </div>
</section>''', '''
.import { display: flex; align-items: center; gap: 16px; width: 1040px; height: 72px; margin-top: 30px; padding: 0 28px; border-radius: 999px; background: var(--surface); box-shadow: 0 0 0 6px rgba(226, 238, 249, 0.7); }
.import > .ic { color: var(--ai); }
.import .value { font-size: 21px; font-weight: 500; color: var(--ink-2); }
.import .found { display: inline-flex; align-items: center; gap: 8px; margin-left: auto; font-size: 17px; font-weight: 600; color: var(--ok-ink); }
.import .found .ic { width: 18px; height: 18px; color: var(--ok); stroke-width: 3; }
.work { display: grid; grid-template-columns: 280px 560px 1fr; gap: 40px; align-items: start; margin-top: 40px; }
.steps { display: flex; flex-direction: column; gap: 18px; padding: 24px; }
.steps ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 16px; }
.steps li { display: grid; grid-template-columns: 30px 1fr auto; gap: 12px; align-items: center; }
.steps li b { display: block; font-size: 15px; font-weight: 600; color: var(--ink-2); line-height: 1.3; }
.steps li small { display: block; font-size: 13px; color: var(--muted); }
.steps .n { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: var(--ai-soft); color: var(--ai); font-size: 14px; font-weight: 700; }
.steps .n .ic { width: 16px; height: 16px; stroke-width: 3; }
.steps li.now .n { background: var(--ink-2); color: var(--surface); }
.steps li.todo .n { background: var(--human-soft); color: var(--human); }
.step .body { display: grid; gap: 14px; font-size: 23px; }
.asked { font-weight: 500; color: var(--ink-2); line-height: 1.4; margin-bottom: 10px; }
.said { color: var(--body); line-height: 1.55; }
.src { margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--line); font-size: 16px; color: var(--muted); }
.side { display: flex; flex-direction: column; gap: 34px; padding-top: 30px; }
.note .crit { font-size: 29px; line-height: 1.5; }
.note hr { margin: 24px 0 20px; border: 0; border-top: 1.5px dashed #e4cf7a; }
.save { display: flex; align-items: center; gap: 18px; }
''')


# 03b: the student's log and the final version -----------------------------------------------------------------------

EARLY = [("Outline the argument", "Kept 1 and 3. Workload is off-topic.", False),
         ("Find two sources", "Smith &amp; Lee doesn't exist. I searched, then replaced it.", True),
         ("Draft the intro", "Too generic. Rewrote it in my own words.", False)]
early_rows = "".join(f'<li><small>Step {i + 1}</small><b>{t}</b><p>{c}</p>{depth(DEPTH[i])}{"<em>AI error caught</em>" if caught else ""}</li>'
                     for i, (t, c, caught) in enumerate(EARLY))
later_rows = "".join(f'<li><small>Step {i + 1}</small><b>{TITLES[i]}</b>{depth(DEPTH[i])}{"<em>caught</em>" if i in FIXED else ""}</li>'
                     for i in range(4, 9))
summary = "".join([chip("Your grader sees this log", "outline", False), chip("9 steps", "outline", False),
                   chip("3 AI errors caught", "ok", False), chip(f"{UNMATCHED_PCT} not from logged AI", "human", False)])
page("03b-student-log.html", "My log", nav("student", 1), f'''
{head("My log", "Nine steps, each with a critique stuck on.", end=f'<div class="summary">{summary}</div>')}
<section class="desk">
  {paper("Steps 1 to 3", f'<ol class="list">{early_rows}</ol>', -1.2)}
  <div class="slot">
    {paper("Step 4 · Check the facts", """<p class="kicker label-human">You asked</p><p>Why do universities split assessment into two lanes?</p>
      <p class="kicker label-ai">The AI said</p><p class="said">The two-lane model, introduced in <span class="wrong">2019</span>, separates…</p>""", 1.2)}
    {sticky(f'<span class="kicker label-human">Critique {depth(3)}</span><p>Wrong date. Sydney introduced it in 2023…</p>', "", 4, 0, "pin", "left:110px;top:300px;width:270px")}
    {sticky(f'<p class="caught">{icon("check")}AI error caught</p>', "mint", 6, 1, "pin", "right:-14px;top:-30px")}
  </div>
  {paper("Steps 5 to 9", f'<ol class="list">{later_rows}</ol>', -0.6)}
  {paper("Final version", f"""<h2>Final version</h2><p class="muted-text">essay2-final.docx, linked to all nine steps and their critiques.</p>
    <p class="kicker label-muted">Before you submit</p>
    <div class="share"><i style="width:{UNMATCHED * 100:.0f}%"></i></div>
    <p class="own">{UNMATCHED_PCT} not from your logged AI</p><p class="muted-text">The rest matches AI answers you logged.</p>
    <button class="btn primary" type="button">Submit final version</button>""", -1, "final")}
</section>''', '''
.head { align-items: flex-start; }
.summary { display: flex; gap: 10px; margin-top: 30px; }
.desk { display: grid; grid-template-columns: 290px 360px 290px 1fr; gap: 34px; align-items: start; margin-top: 60px; }
.desk .paper { min-height: 520px; }
.desk .body { display: flex; flex-direction: column; gap: 10px; }
.list { list-style: none; margin: 0; padding: 0; display: grid; gap: 18px; }
.list li { display: grid; gap: 4px; padding-bottom: 14px; border-bottom: 1px solid var(--line); }
.list li:last-child { border-bottom: 0; }
.list small { font-size: 13px; font-weight: 700; color: var(--muted); }
.list b { font-size: 16px; font-weight: 600; color: var(--ink-2); }
.list p { font-size: 15px; color: var(--body); }
.list em { justify-self: start; padding: 2px 10px; border-radius: 6px; background: var(--mint); color: var(--ok-ink); font-size: 13px; font-weight: 700; font-style: normal; }
.slot { position: relative; }
.slot .body p { font-size: 17px; }
.said { color: var(--body); }
.slot .sticky p { font-size: 19px; }
.slot .kicker { display: flex; align-items: center; gap: 10px; }
.caught { display: flex; align-items: center; gap: 8px; font-size: 16px !important; color: var(--ok-ink) !important; }
.caught .ic { width: 18px; height: 18px; stroke: var(--ok); stroke-width: 3; }
.final .body { gap: 14px; }
.final h2 { font-size: 34px; }
.muted-text { font-size: 16px; color: var(--body); }
.share { height: 12px; border-radius: 6px; background: var(--ai); overflow: hidden; }
.share i { display: block; height: 12px; border-radius: 6px; background: var(--human); }
.own { font-size: 19px; font-weight: 700; color: var(--human-ink); }
.final .btn { margin-top: 12px; }
''')


# 04: grader review queue ---------------------------------------------------------------------------------------------

QUEUE = [("John Doe", "JD", "", 0.68, ["Step 6 · 0 of 3", "Step 8 · reads like AI"]),
         ("Alex Kim", "AK", "ok", 0.81, ["Step 3 · 1 of 3"])]


def queue_row(i, name, initials, tone, unmatched, flags):
    chips = "".join(chip(f, "flag") for f in flags)
    return f'''<li class="row{" hover" if i == 0 else ""}"><span class="avatar {tone}">{initials}</span>
<span><b>{name}</b><small>{len(flags)} flagged · {unmatched * 100:.0f}% not from logged AI</small></span>
<span class="flags">{chips}</span>{icon("chev")}</li>'''


def dot_plot(width=560, height=300, highlight=0):
    values = shares()
    lo, bins = 0.4, 30
    left, right, base = 44, width - 44, height - 60

    def px(v):
        return left + (right - left) * (v - lo) / (1 - lo)

    stacks = [0] * bins
    dots, label = [], ""
    for i, v in enumerate(values):
        b = min(bins - 1, max(0, int((v - lo) / (1 - lo) * bins)))
        cx = px(lo + (b + 0.5) / bins * (1 - lo))
        cy = base - 9 - stacks[b] * 18
        stacks[b] += 1
        on = i == highlight
        fill = "#ff8a3d" if i < len(QUEUE) else "#ffc79f"
        dots.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{10 if on else 7.5}" fill="{fill}" opacity="{1 if on else 0.55}"/>')
        if on:
            text = f"{QUEUE[i][0]} · {v * 100:.0f}%"
            w = 16 + len(text) * 8.6
            label = (f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="16" fill="none" stroke="#ff8a3d" stroke-width="2.5"/>'
                     f'<rect x="{cx - w / 2:.1f}" y="{cy - 62:.1f}" width="{w:.1f}" height="34" rx="17" fill="#262e35"/>'
                     f'<path d="M{cx - 7:.1f} {cy - 28.5:.1f} l7 7 l7 -7z" fill="#262e35"/>'
                     f'<text x="{cx:.1f}" y="{cy - 39:.1f}" text-anchor="middle" font-size="16" font-weight="600" fill="#fff">{text}</text>')
    mid = median(values)
    ticks = "".join(f'<text x="{px(t):.1f}" y="{base + 34}" text-anchor="middle" font-size="15" fill="#8a949c">{t * 100:.0f}%</text>' for t in (0.4, 0.6, 0.8, 1.0))
    return (f'<svg viewBox="0 0 {width} {height}" width="{width}" height="{height}" font-family="Inter, sans-serif">'
            f'<line x1="{px(mid):.1f}" y1="20" x2="{px(mid):.1f}" y2="{base}" stroke="#262e35" stroke-opacity=".3" stroke-width="1.5" stroke-dasharray="4 5"/>'
            f'<text x="{px(mid) + 8:.1f}" y="34" font-size="15" font-weight="600" fill="#4b5256">median {mid * 100:.0f}%</text>'
            + "".join(dots) + f'<rect x="{left}" y="{base}" width="{right - left}" height="1.5" fill="#e6edf3"/>' + ticks + label + "</svg>")


faces = "".join(f'<span class="avatar sm {t}">{n}</span>' for n, t in
                [("JR", "ai"), ("SL", "lilac"), ("PS", "rose"), ("TN", "tint"), ("ML", "ok"), ("RB", ""), ("EW", "ai")])
page("04-instructor-overview.html", "Review queue", nav("grader", 0), f'''
{head("Essay 2", f"{SUBMITTED} submitted. Two need a closer look first.", "INFOMGMT 399  /  Essay 2")}
<section class="triage">
  <div class="queue">
    {aside("read these two first", "M2 34 C40 10 80 6 110 24 M110 24 l-13 -2 M110 24 l-3 -12", 114, 40, -3, "left:420px;top:-34px", length=140)}
    <p class="kicker label-flag">Look closer first <span class="label-muted">· about 6 min</span></p>
    <ol>{"".join(queue_row(i, *q) for i, q in enumerate(QUEUE))}</ol>
    <p class="kicker label-muted">Ready to mark · {SUBMITTED - len(QUEUE)}</p>
    <div class="ready"><span class="faces">{faces}<span class="avatar sm more">+{SUBMITTED - len(QUEUE) - 7}</span></span>
      <span><b>No flags, critiques look solid</b><small>Mark them in the usual way</small></span>
      <button class="btn ghost sm" type="button">Mark in order</button></div>
  </div>
  <div class="card plot">
    <h2>Not from logged AI, per essay</h2>
    <p class="caption">Each dot is one student's essay.</p>
    {dot_plot()}
    <p class="caption">{SUBMITTED} essays, each compared against its logged AI answers</p>
  </div>
</section>''', '''
.triage { display: grid; grid-template-columns: 800px 1fr; gap: 40px; margin-top: 44px; }
.queue { position: relative; display: flex; flex-direction: column; gap: 14px; }
.queue ol { list-style: none; margin: 0 0 22px; padding: 0; display: grid; gap: 16px; }
.row { display: grid; grid-template-columns: 56px minmax(0, 1fr) auto 24px; gap: 16px; align-items: center; height: 112px; padding: 0 28px 0 30px; border-radius: 20px; background: var(--surface); box-shadow: var(--lift); cursor: pointer; transition: transform 0.16s var(--ease-out), box-shadow 0.16s var(--ease-out); }
.row:hover, .row.hover { transform: translateY(-3px); box-shadow: var(--lift), 0 0 0 2.5px var(--ai); }
.row .avatar { width: 56px; height: 56px; font-size: 20px; }
.row b { display: block; font-size: 26px; font-weight: 700; letter-spacing: -0.01em; color: var(--ink); }
.row small { font-size: 17px; color: var(--muted); white-space: nowrap; }
.row .chip { height: 30px; padding: 0 12px; font-size: 15px; }
.row .flags { display: flex; gap: 10px; }
.row > .ic { color: var(--muted); }
.row.hover > .ic { color: var(--ai); }
.ready { display: grid; grid-template-columns: auto 1fr auto; gap: 24px; align-items: center; height: 100px; padding: 0 24px; border-radius: 20px; background: rgba(255, 255, 255, 0.7); box-shadow: inset 0 0 0 1px var(--line); }
.faces { display: flex; }
.faces .avatar { margin-right: -8px; }
.faces .more { background: var(--subtle); color: var(--body); box-shadow: 0 0 0 3px var(--surface), inset 0 0 0 1px var(--line); }
.ready b { display: block; font-size: 20px; font-weight: 600; }
.ready small { font-size: 17px; color: var(--muted); }
.plot { display: flex; flex-direction: column; gap: 8px; padding: 30px 32px; }
.plot svg { margin: 18px 0 8px; width: 100%; height: auto; }
''')


# 05: all submissions -------------------------------------------------------------------------------------------------

ROSTER = [("John Doe", "JD", "", 9, 2.0, "2 flagged", "flag"), ("Alex Kim", "AK", "ok", 11, 1.8, "1 flagged", "flag"),
          ("Jane Roe", "JR", "ai", 7, 2.7, "Ready to mark", "plain"), ("Sam Lee", "SL", "lilac", 5, 2.4, "Ready to mark", "plain"),
          ("Priya Shah", "PS", "rose", 8, 2.6, "Ready to mark", "plain"), ("Tom Ng", "TN", "tint", 6, 2.9, "Marked", "ok"),
          ("Mia Lopez", "ML", "ok", 10, 2.5, "Marked", "ok"), ("Ravi Bose", "RB", "", 7, 2.2, "Ready to mark", "plain")]
values = shares()
table_rows = "".join(f'''<tr{' class="hover"' if i == 0 else ""}><td><span class="person"><span class="avatar sm {tone}">{ini}</span>{name}</span></td>
<td class="num">{steps}</td>
<td><span class="share"><i style="width:{values[i] * 100:.0f}%"></i></span><b class="pct">{values[i] * 100:.0f}%</b></td>
<td>{depth(round(avg), "flag" if tag == "flag" else "")}<span class="avg">{avg:.1f} of 3</span></td>
<td>{chip(status, tag)}</td><td class="go">{icon("chev")}</td></tr>''' for i, (name, ini, tone, steps, avg, status, tag) in enumerate(ROSTER))
page("05-submissions.html", "Submissions", nav("grader", 0), f'''
{head("All submissions", f"Essay 2 · {SUBMITTED} submitted · flagged first", "INFOMGMT 399  /  Essay 2  /  Submissions",
      '<div class="filters"><span class="seg on">All 48</span><span class="seg">Look closer 2</span><span class="seg">Ready 39</span><span class="seg">Marked 7</span></div>')}
<section class="card table">
  <table>
    <thead><tr><th>Student</th><th class="num">Steps</th><th>Not from logged AI</th><th>Critique questions answered</th><th>Status</th><th></th></tr></thead>
    <tbody>{table_rows}</tbody>
  </table>
  <p class="caption foot">Showing 8 of {SUBMITTED}. The share of each final essay matching none of its logged AI answers; unmatched text is not proof of authorship.</p>
</section>''', '''
.filters { position: relative; display: inline-flex; padding: 4px; border-radius: 999px; background: var(--surface); box-shadow: var(--lift); }
.seg { height: 38px; padding: 0 18px; border-radius: 999px; display: inline-flex; align-items: center; font-size: 16px; font-weight: 600; color: var(--body); }
.seg.on { background: var(--ink-2); color: var(--surface); }
.table { margin-top: 44px; padding: 10px 14px 18px; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; padding: 18px 18px 14px; font-size: 14px; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; color: var(--muted); border-bottom: 1px solid var(--line); }
td { padding: 14px 18px; border-bottom: 1px solid var(--line); vertical-align: middle; font-size: 17px; }
tbody tr { transition: background 0.16s var(--ease-out); }
tbody tr:hover, tbody tr.hover { background: var(--subtle); }
.num { text-align: right; font-variant-numeric: tabular-nums; width: 90px; }
.person { display: flex; align-items: center; gap: 14px; font-size: 18px; font-weight: 600; color: var(--ink); }
.person .avatar { box-shadow: none; }
td .share { display: inline-block; width: 220px; height: 10px; margin-right: 14px; border-radius: 5px; background: var(--ai); overflow: hidden; vertical-align: middle; }
td .share i { display: block; height: 10px; border-radius: 5px; background: var(--human); }
.pct { font-weight: 700; color: var(--human-ink); font-variant-numeric: tabular-nums; }
.avg { margin-left: 12px; color: var(--body); font-variant-numeric: tabular-nums; }
.go { width: 40px; color: var(--muted); }
tr.hover .go { color: var(--ai); }
.foot { padding: 16px 18px 0; }
''')


# 06: John Doe's Process Visualiser -----------------------------------------------------------------------------------

ESSAY = [("Generative AI now writes fluent essays in seconds, so universities can", None),
         ("no longer out-design it. Sydney's answer, introduced in 2023, is the", None),
         ("two-lane model: secure, supervised assessment in Lane 1, and open use", 2),
         ("of AI in Lane 2, where students are marked on how they use it.", 2), ("", None),
         ("This essay argues that Lane 2 only works if graders can see the thinking", None),
         ("behind the work. A student who catches a source the AI invented is doing", None),
         ("exactly the evaluation the model was designed to reward.", None), ("", None),
         ("Most students already use AI tools every week, and staff say that raw", 4),
         ("chat logs are too long to read across a large cohort.", 4),
         ("A structured log changes that: every prompt, answer and critique becomes", None),
         ("a step, so a grader can audit the process in minutes rather than hours.", 8)]
essay_rows = []
for k, (line, step) in enumerate(ESSAY):
    first = step is not None and (k == 0 or ESSAY[k - 1][1] != step)
    tag = f'<i class="tag">{step + 1}</i>' if first else ""
    cls = ' class="ai"' if step is not None else ""
    lit = " lit" if step == 2 else ""
    essay_rows.append(f'<li{cls}>{tag}<span class="{"hl-ai" if step is not None else ""}{lit}">{line or "&nbsp;"}</span></li>')
columns = []
for i in range(9):
    badge = ""
    if i in FIXED:
        badge = f'<span class="badge mint">{icon("check")}</span>'
    elif i in FLAGGED:
        badge = f'<span class="badge pink">{icon("flag")}</span>'
    lit = " lit" if i == 2 else ""
    bar = f'<i style="height:{max(USED[i], 4)}px" class="{"" if USED[i] else "none"}"></i>'
    columns.append(f'<li class="{lit.strip()}">{badge}{bar}<small>Step {i + 1}</small>{depth(DEPTH[i], "flag" if i in FLAGGED else "")}</li>')
page("06-process-visualiser.html", "John Doe", nav("grader", 1), f'''
<div class="head"><div class="id"><span class="avatar lg">JD</span><div><h1 class="name">John Doe</h1>
<p class="sub">Essay 2 · final version submitted Friday · nine steps logged</p></div></div>
<button class="btn ghost sm" type="button">{icon("download")}Export PDF</button></div>
<section class="viz">
  {paper("essay2-final.docx · 1,200 words · page 1 of 3", f"""<p class="status">{icon("check")}Blue lines match a logged AI answer</p>
    <ol class="essay">{"".join(essay_rows)}</ol><div class="more"><i></i><i></i><i style="width:60%"></i></div>""", 0, "doc")}
  <div class="right">
    <div class="card own">
      <p class="kicker" style="color:var(--human-ink)">Not from logged AI</p>
      <div class="big"><span class="pct">{UNMATCHED_PCT}</span><span>of the final essay matches<br>none of John's logged AI answers</span></div>
      <div class="share"><i style="width:{UNMATCHED * 100:.0f}%"></i></div>
      <div class="legend"><span style="color:var(--human-ink)">{FINAL_WORDS - MATCHED:,} unmatched words</span><span class="label-ai">{MATCHED:,} match logged AI answers</span></div>
      <p class="caption note-line">Unmatched text is a prompt for judgement, not proof of authorship.</p>
    </div>
    <div class="card where">
      <h2>Where the AI text came from</h2>
      <p class="caption">Words of each step's AI answer that made it into the essay</p>
      <ol class="cols">{"".join(columns)}</ol>
      <div class="key-row"><span>{depth(2)} questions answered</span><span><i class="sw mint"></i>AI error caught</span><span><i class="sw pink"></i>flagged</span></div>
      <div class="tip" style="left:22px;top:86px;--x:138px"><b class="label-ai">Step 3 · {TITLES[2]}</b>150 words of its AI answer made it into the essay.</div>
    </div>
  </div>
  <svg class="connect" data-from=".essay .lit" data-to=".cols li.lit i" data-side="top" style="--c:var(--ai)"><path/><circle r="5"/><circle r="5"/></svg>
</section>''', '''
.id { display: flex; align-items: center; gap: 22px; }
.name { font-size: 56px; }
.id .sub { margin-top: 6px; font-size: 21px; }
.head { align-items: center; }
.viz { position: relative; display: grid; grid-template-columns: 720px 1fr; gap: 40px; margin-top: 36px; }
.doc { height: 650px; }
.status { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; font-size: 17px; font-weight: 600; color: var(--ai); }
.status .ic { width: 18px; height: 18px; stroke-width: 3; }
.essay { list-style: none; margin: 0; padding: 0; font-size: 17px; line-height: 30px; color: var(--ink-2); }
.essay li { position: relative; padding-left: 28px; }
.essay li.ai::before { content: ""; position: absolute; left: -6px; top: 4px; bottom: 4px; width: 4px; border-radius: 2px; background: var(--ai); }
.essay .tag { position: absolute; left: -18px; top: 4px; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: var(--ai); color: var(--surface); font-size: 13px; font-weight: 700; font-style: normal; }
.essay .lit { box-shadow: 0 0 0 3px var(--ai-soft), 0 0 0 4.5px rgba(9, 155, 255, 0.35); }
.more { display: grid; gap: 15px; margin-top: 28px; padding-left: 28px; }
.more i { display: block; width: 92%; height: 9px; border-radius: 5px; background: var(--line); }
.right { display: flex; flex-direction: column; gap: 24px; }
.own { padding: 22px 30px; }
.big { display: flex; align-items: center; gap: 22px; margin: 6px 0 14px; font-size: 20px; font-weight: 600; line-height: 1.3; }
.big .pct { font-size: 84px; font-weight: 700; letter-spacing: -0.03em; color: var(--human); line-height: 1; }
.own .share { height: 16px; border-radius: 8px; background: var(--ai); overflow: hidden; }
.own .share i { display: block; height: 16px; border-radius: 8px; background: var(--human); }
.legend { display: flex; justify-content: space-between; margin-top: 12px; font-size: 16px; font-weight: 600; }
.where { position: relative; padding: 26px 30px 22px; }
.cols { list-style: none; margin: 18px 0 0; padding: 0; display: grid; grid-template-columns: repeat(9, 1fr); align-items: end; height: 260px; border-bottom: 1.5px solid var(--line); }
.cols li { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; border-radius: 14px; }
.cols li.lit { background: var(--subtle); box-shadow: inset 0 0 0 2px var(--ai); }
.cols i { display: block; width: 34px; border-radius: 9px; background: var(--ai); }
.cols i.none { background: var(--line); border-radius: 2px; }
.cols small { position: absolute; bottom: -30px; font-size: 13px; font-weight: 600; color: var(--muted); white-space: nowrap; }
.cols .depth { position: absolute; bottom: -54px; }
.cols li.lit small { color: var(--ink-2); }
.badge { display: grid; place-items: center; width: 36px; height: 32px; margin-bottom: 10px; border-radius: 6px; box-shadow: var(--lift); }
.badge .ic { width: 18px; height: 18px; stroke-width: 2.6; }
.badge.mint { background: var(--mint); color: var(--ok); rotate: 4deg; }
.badge.pink { background: var(--pink); color: var(--flag); rotate: -4deg; }
.key-row { display: flex; gap: 18px; margin-top: 66px; font-size: 14px; color: var(--body); }
.note-line { margin-top: 8px; font-size: 14px; }
.key-row span { display: inline-flex; align-items: center; gap: 8px; }
.sw { width: 22px; height: 20px; border-radius: 4px; }
.sw.mint { background: var(--mint); } .sw.pink { background: var(--pink); }
''')


# 06b: a flagged step, with the reflection check's evidence ------------------------------------------------------------

page("06b-flagged-step.html", "Step 6, flagged", nav("grader", 2), f'''
{head("Step 6, flagged", "The reflection check explains. You decide.", "Cohort  /  John Doe  /  Step 6", chip("Flagged", "flag"))}
<section class="audit">
  <div class="card asked"><p class="kicker label-human">What John asked</p><p>Is my conclusion consistent with the evidence in my essay?</p></div>
  <div class="answer">
    {paper("Step 6 · AI answer", f"""<p class="kicker label-ai">What the AI said</p>
      <p class="said">Mostly, but <span class="hl-flag">paragraph 4 overstates the survey results</span>. Consider softening that claim before you submit.</p>""", -1)}
    {sticky(f'<span class="kicker label-human">John&#39;s critique</span><p class="quote">“Looks good.”</p><p class="zero">{depth(0, "muted")} 0 of 3 questions</p>', "", -5, 0, "pin", "left:250px;top:330px;width:280px")}
  </div>
  <div class="check">
    {sticky(f"""<span class="kicker label-flag">{icon("flag")} Reflection check · LLM</span>
      <h2>Possible low-effort reflection</h2><p class="kicker" style="color:var(--flag-ink)">The three questions John saw while writing</p>
      {questions("missed")}<p class="evidence">It skips the AI's point about paragraph 4.</p>
      <p class="small">A prompt to look closer, not a grade.</p>""", "pink", 2.5, 1)}
    <div class="decide"><button class="btn ghost sm" type="button">Dismiss flag</button><button class="btn primary sm" type="button">Add to feedback</button></div>
  </div>
  <svg class="connect" data-from=".hl-flag" data-to=".evidence" style="--c:var(--flag)"><path/><circle r="5"/><circle r="5"/></svg>
</section>''', '''
.audit { position: relative; display: grid; grid-template-columns: 280px 500px 1fr; gap: 36px; align-items: start; margin-top: 44px; }
.asked { padding: 26px 28px; display: grid; gap: 12px; font-size: 22px; font-weight: 500; }
.answer { position: relative; }
.answer .paper { height: 440px; }
.said { margin-top: 18px; font-size: 25px; line-height: 1.6; color: var(--body); }
.quote { font-size: 36px !important; font-weight: 700 !important; letter-spacing: -0.01em; }
.zero { display: flex; align-items: center; gap: 10px; margin-top: 10px; font-size: 17px !important; color: #a08a3c !important; }
.check { display: flex; flex-direction: column; gap: 34px; padding-top: 8px; }
.check .sticky { padding: 28px 30px 26px; }
.check .kicker { display: flex; align-items: center; gap: 8px; }
.check .kicker .ic { width: 20px; height: 20px; }
.check h2 { margin: 6px 0 14px; font-size: 26px; }
.check .qs { margin: 14px 0 18px; }
.evidence { font-size: 20px !important; }
.small { margin-top: 18px; font-size: 17px !important; color: var(--flag-ink) !important; }
.decide { display: flex; justify-content: flex-end; gap: 14px; }
''')


# 07: the report and its export ---------------------------------------------------------------------------------------

report_bars = "".join(
    f'<li><span class="mark {"ok" if i in FIXED else "flag" if i in FLAGGED else ""}"></span>{f"<b>{USED[i]}</b>" if USED[i] else ""}'
    f'<i style="height:{max(USED[i] * 0.8, 3):.0f}px" class="{"" if USED[i] else "none"}"></i><small>Step {i + 1}</small></li>'
    for i in range(9))
page("07-pdf-report.html", "Report", nav("grader", 3), f'''
{head("Report", "John Doe · Essay 2, ready for moderation.")}
<section class="report">
  <div class="stack">
    <div class="paper sheet-behind" style="--r:3.5deg"></div>
    {paper("john-doe-essay-2.pdf · page 1 of 2", f"""<div class="mast"><span class="logo">{OWL}AI-Interaction Analytics</span><span class="caption">Process report</span></div>
      <div class="title"><h2>John Doe · Essay 2</h2><span class="caption">INFOMGMT 399 · Lane 2</span></div>
      <div class="facts"><div><b style="color:var(--human)">{UNMATCHED_PCT}</b><small>not from logged AI</small></div><div><b style="color:var(--ok)">3</b><small>AI errors caught</small></div><div><b style="color:var(--flag)">2</b><small>flagged steps</small></div></div>
      <h3>Where the AI text came from</h3><ol class="bars">{report_bars}</ol>
      <p class="key"><span><i class="sq"></i>words of the step's AI answer kept in the essay</span><span><i class="mark ok"></i>AI error caught</span><span><i class="mark flag"></i>flagged</span></p>
      <h3>Flagged steps</h3>
      <ul class="flagged"><li><b>Step 6</b>“Looks good.”  0 of 3 questions, added to feedback</li><li><b>Step 8</b>Reads like AI-written text</li></ul>
      <h3>Full prompt history</h3><div class="lines"><i></i><i></i><i style="width:70%"></i></div>""", -1, "pdf")}
  </div>
  <div class="export">
    <div class="card panel">
      <div class="panel-h"><h2>Export</h2><span class="caption">PDF · 2 pages</span></div>
      <label class="opt">Standard PDF report<span class="radio on"></span></label>
      <label class="opt">CSV of every step<span class="radio"></span></label>
      <label class="opt">Full prompt history<span class="toggle on"></span></label>
      <label class="opt">Grader notes<span class="toggle on"></span></label>
      <button class="btn primary" type="button">{icon("download")}Download PDF</button>
    </div>
    {sticky(f'<p class="saved">{icon("check")}<span><small>SAVED</small>john-doe-essay-2.pdf<em>2 pages, ready to file</em></span></p>', "mint", -3, 0)}
  </div>
</section>''', '''
.report { display: grid; grid-template-columns: 800px 1fr; gap: 70px; margin-top: 40px; }
.stack { position: relative; }
.sheet-behind { position: absolute; left: 36px; top: 14px; width: 780px; height: 760px; }
.pdf { width: 780px; }
.pdf .body { display: flex; flex-direction: column; gap: 16px; padding: 30px 48px 40px; }
.mast { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 1px solid var(--line); }
.mast .logo { font-size: 16px; } .mast .logo svg { width: 28px; height: 28px; }
.title { display: flex; justify-content: space-between; align-items: baseline; }
.title h2 { font-size: 34px; }
.facts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.facts div { padding: 18px; border-radius: 12px; background: var(--subtle); }
.facts b { display: block; font-size: 38px; font-weight: 700; letter-spacing: -0.02em; }
.facts small { font-size: 15px; font-weight: 500; color: var(--body); }
.pdf h3 { margin-top: 10px; font-size: 18px; font-weight: 700; color: var(--ink-2); }
.bars { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(9, 1fr); align-items: end; height: 190px; }
.bars li { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 6px; height: 100%; }
.bars b { font-size: 13px; font-weight: 600; color: var(--ink-2); }
.bars small { font-size: 13px; color: var(--muted); }
.key { display: flex; gap: 22px; font-size: 14px; color: var(--body); }
.key span { display: inline-flex; align-items: center; gap: 8px; }
.key .sq { width: 14px; height: 14px; border-radius: 4px; background: var(--ai); }
.bars i { display: block; width: 30px; border-radius: 6px; background: var(--ai); }
.bars i.none { background: var(--line); }
.mark { width: 12px; height: 12px; border-radius: 50%; }
.mark.ok { background: var(--ok); } .mark.flag { background: var(--flag); }
.flagged { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; font-size: 17px; color: var(--body); }
.flagged li { display: flex; gap: 14px; align-items: center; }
.flagged li::before { content: ""; width: 10px; height: 10px; border-radius: 50%; background: var(--flag); }
.flagged b { color: var(--ink-2); }
.lines { display: grid; gap: 14px; }
.lines i { display: block; width: 100%; height: 10px; border-radius: 5px; background: var(--line); }
.export { display: flex; flex-direction: column; gap: 46px; padding-top: 30px; }
.panel { display: grid; gap: 4px; padding: 30px 32px; }
.panel-h { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
.opt { display: flex; justify-content: space-between; align-items: center; height: 58px; border-bottom: 1px solid var(--line); font-size: 20px; font-weight: 500; color: var(--ink-2); }
.radio { width: 26px; height: 26px; border-radius: 50%; box-shadow: inset 0 0 0 2.5px #c9d3dc; }
.radio.on { box-shadow: inset 0 0 0 2.5px var(--ai), inset 0 0 0 7px var(--surface); background: var(--ai); }
.toggle { position: relative; width: 52px; height: 30px; border-radius: 15px; background: #d5dde4; }
.toggle::after { content: ""; position: absolute; top: 4px; left: 4px; width: 22px; height: 22px; border-radius: 50%; background: var(--surface); transition: transform 0.2s var(--ease-out); }
.toggle.on { background: var(--ai); } .toggle.on::after { transform: translateX(22px); }
.panel .btn { margin-top: 26px; }
.export .sticky { width: 440px; align-self: flex-start; margin-left: 20px; }
.saved { display: flex; gap: 16px; align-items: center; font-size: 21px !important; }
.saved .ic { width: 26px; height: 26px; stroke: var(--ok); stroke-width: 3; }
.saved small { display: block; font-size: 14px; font-weight: 700; color: var(--ok-ink); }
.saved em { display: block; font-size: 17px; font-style: normal; font-weight: 500; color: #3d8b67; }
''')
