import Header from "../components/Header";
import Footer from "../components/Footer";
import TrustStrip from "../components/TrustStrip";
import "./size-guide.css";

export const metadata = {
  title: "Size guide — Elite Zone J",
  description:
    "How to measure for our suits, shirts, trousers and dresses. Body measurements in inches and centimetres, mapped to our standard sizes.",
};

export const dynamic = "force-dynamic";

export default function SizeGuidePage() {
  return (
    <>
      <Header />
      <main className="sg">
        <section className="sg-hero">
          <div className="crumb t-mono-xs">
            <a href="/">Home</a>
            <span className="sep">/</span>
            <span>Size guide</span>
          </div>
          <h1>Size guide</h1>
          <p className="standfirst">
            All measurements are body measurements, not garment measurements.
            Take them over a fitted shirt and trouser, with the tape snug but
            not tight. If you fall between two sizes, choose the larger one
            for relaxed fits and the smaller for tailored.
          </p>
        </section>

        <section className="sg-section">
          <h2>How to measure</h2>
          <ul className="sg-howto">
            <li><b>Chest.</b> Around the fullest part, under the arms, tape parallel to the floor.</li>
            <li><b>Waist.</b> Around the natural waist (just above the hip bone), not where you wear your trousers.</li>
            <li><b>Hip.</b> Around the fullest part of the seat, feet together.</li>
            <li><b>Inseam.</b> From the crotch seam to the bottom of the ankle, along the inside leg.</li>
            <li><b>Neck.</b> Around the base of the neck, with one finger between tape and skin.</li>
            <li><b>Sleeve.</b> From the centre back of the neck, over the shoulder, down to the wrist with arm slightly bent.</li>
          </ul>
        </section>

        <section className="sg-section">
          <h2>Men · suits, jackets, sherwanis</h2>
          <div className="sg-tbl-wrap">
            <table className="sg-tbl">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Chest (in)</th>
                  <th>Waist (in)</th>
                  <th>Chest (cm)</th>
                  <th>Waist (cm)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>36</td><td>35 – 36</td><td>29 – 30</td><td>89 – 91</td><td>74 – 76</td></tr>
                <tr><td>38</td><td>37 – 38</td><td>31 – 32</td><td>94 – 97</td><td>79 – 81</td></tr>
                <tr><td>40</td><td>39 – 40</td><td>33 – 34</td><td>99 – 102</td><td>84 – 86</td></tr>
                <tr><td>42</td><td>41 – 42</td><td>35 – 36</td><td>104 – 107</td><td>89 – 91</td></tr>
                <tr><td>44</td><td>43 – 44</td><td>37 – 38</td><td>109 – 112</td><td>94 – 97</td></tr>
                <tr><td>46</td><td>45 – 46</td><td>39 – 40</td><td>114 – 117</td><td>99 – 102</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="sg-section">
          <h2>Men · shirts</h2>
          <div className="sg-tbl-wrap">
            <table className="sg-tbl">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Neck (in)</th>
                  <th>Chest (in)</th>
                  <th>Sleeve (in)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>S</td><td>14.5 – 15</td><td>36 – 38</td><td>33</td></tr>
                <tr><td>M</td><td>15 – 15.5</td><td>38 – 40</td><td>33.5</td></tr>
                <tr><td>L</td><td>15.5 – 16</td><td>40 – 42</td><td>34</td></tr>
                <tr><td>XL</td><td>16.5 – 17</td><td>42 – 44</td><td>34.5</td></tr>
                <tr><td>XXL</td><td>17.5 – 18</td><td>44 – 46</td><td>35</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="sg-section">
          <h2>Men · trousers</h2>
          <div className="sg-tbl-wrap">
            <table className="sg-tbl">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Waist (in)</th>
                  <th>Hip (in)</th>
                  <th>Inseam (in)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>30</td><td>30 – 31</td><td>37 – 38</td><td>31</td></tr>
                <tr><td>32</td><td>32 – 33</td><td>39 – 40</td><td>31</td></tr>
                <tr><td>34</td><td>34 – 35</td><td>41 – 42</td><td>32</td></tr>
                <tr><td>36</td><td>36 – 37</td><td>43 – 44</td><td>32</td></tr>
                <tr><td>38</td><td>38 – 39</td><td>45 – 46</td><td>33</td></tr>
                <tr><td>40</td><td>40 – 41</td><td>47 – 48</td><td>33</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="sg-section">
          <h2>Women · dresses, gowns, suits</h2>
          <div className="sg-tbl-wrap">
            <table className="sg-tbl">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Bust (in)</th>
                  <th>Waist (in)</th>
                  <th>Hip (in)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>XS</td><td>32 – 33</td><td>24 – 25</td><td>34 – 35</td></tr>
                <tr><td>S</td><td>34 – 35</td><td>26 – 27</td><td>36 – 37</td></tr>
                <tr><td>M</td><td>36 – 37</td><td>28 – 29</td><td>38 – 39</td></tr>
                <tr><td>L</td><td>38 – 40</td><td>30 – 32</td><td>40 – 42</td></tr>
                <tr><td>XL</td><td>41 – 43</td><td>33 – 35</td><td>43 – 45</td></tr>
                <tr><td>XXL</td><td>44 – 46</td><td>36 – 38</td><td>46 – 48</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="sg-section">
          <h2>Bespoke &amp; made-to-measure</h2>
          <p>
            For bespoke and made-to-measure orders, the atelier takes fourteen
            measurements at the fitting. The table above is only a starting
            point. If you would prefer a home or studio fitting,{" "}
            <a href="/bespoke#book">book a fitting</a> and we will take the
            full set in person.
          </p>
        </section>

        <section className="sg-section sg-help">
          <h2>Still unsure?</h2>
          <p>
            Email <a href="mailto:atelier@elitezonej.com">atelier@elitezonej.com</a>{" "}
            with your measurements and the piece you are considering. We will
            write back with a recommended size and any notes on fit before you
            order.
          </p>
        </section>
      </main>
      <TrustStrip />
      <Footer />
    </>
  );
}
